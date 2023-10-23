import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';
import {baseURL, readFileAsBase64} from '@/utils/utils.mjs';
import http from '@/utils/http';

Vue.use(Vuex)

let newCustomerId = null;

const state = {
    pageTitle: 'Prospect Capture Form',
    testMode: false,

    globalModal: {
        open: false,
        title: 'Default title',
        body: 'This is a global modal that will deliver notification on global level.',
        busy: false,
        progress: -1,
        persistent: true,
        isError: false,
        buttons: [],
    },

    imageUploader: {
        data: [],
        busy: false,
    }
};

const getters = {
    globalModal : state => state.globalModal,
    testMode : state => state.testMode,
    pageTitle : state => state.pageTitle,
    imageUploader : state => state.imageUploader,
};

const mutations = {
    closeGlobalModal: state => {
        state.globalModal.title = '';
        state.globalModal.body = '';
        state.globalModal.busy = false;
        state.globalModal.open = false;
        state.globalModal.progress = -1;
        state.globalModal.persistent = false;
        state.globalModal.isError = false;
        state.globalModal.buttons.splice(0);
    },
    displayErrorGlobalModal: (state, {title, message, buttons = []}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = false;
        state.globalModal.open = true;
        state.globalModal.progress = -1;
        state.globalModal.persistent = true;
        state.globalModal.isError = true;
        state.globalModal.buttons = [...buttons];
    },
    displayBusyGlobalModal: (state, {title, message, open = true, progress = -1, buttons = []}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = open;
        state.globalModal.open = open;
        state.globalModal.progress = progress;
        state.globalModal.persistent = true;
        state.globalModal.isError = false;
        state.globalModal.buttons = [...buttons];
    },
    displayInfoGlobalModal: (state, {title, message, persistent = false, buttons = []}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = false;
        state.globalModal.open = true;
        state.globalModal.progress = -1;
        state.globalModal.persistent = persistent;
        state.globalModal.isError = false;
        state.globalModal.buttons = [...buttons];
    },

    setPageTitle: (state, title = 'Lead Capture') => {
        state.pageTitle = title;

        if (parent['setMPTheme'])
            parent.setMPTheme(title + ' - NetSuite Australia (Mail Plus Pty Ltd)')
    }
};

const actions = {
    addShortcut : () => {
        parent?.window?.addShortcut()
    },
    testAction : () => { console.log('test'); },
    init : async context => {
        if (!_checkNetSuiteEnv()) return;

        _readUrlParams(context);

        await Promise.allSettled([
            context.dispatch('misc/init'),
            context.dispatch('user/init')
        ]);

        if (context.getters['user/isFranchisee']) // Franchisee Mode, disable customer editing
            context.commit('customer/setInternalId', null);

        context.dispatch('customer/init').then();
        context.dispatch('addresses/init').then();
        context.dispatch('contacts/init').then();
        context.dispatch('invoices/init').then();
        context.dispatch('extra-info/init').then();

    },
    handleException : (context, {title, message}) => {
        context.commit('displayErrorGlobalModal', {
            title, message
        })
    },
    saveNewCustomer : async context => {
        if (context.getters['customer/id']) return;

        if (!context.getters['addresses/all'].data.length) {
            context.commit('displayErrorGlobalModal', {title: 'Missing Address', message: 'Please add at least 1 address for this lead'})
            return;
        }

        if (context.getters['user/isFranchisee'] && context.getters['customer/isHotLead'] && !context.getters['contacts/all'].data.length) {
            context.commit('displayErrorGlobalModal', {title: 'Missing Contact', message: 'Please add at least 1 contact for this lead'})
            return;
        }

        context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Saving new lead. Please wait...'});

        // prepare data for submission
        let customerData = {...context.getters['customer/form'].data};
        let addressArray = JSON.parse(JSON.stringify(context.getters['addresses/all'].data));
        let contactArray = JSON.parse(JSON.stringify(context.getters['contacts/all'].data));

        customerData.custentity_date_lead_entered = new Date();
        delete customerData.entityid; // TODO: entityid must not present

        let customerId = await http.post('saveBrandNewCustomer', {customerData, addressArray, contactArray});

        context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Uploading images. Please wait...'});

        await context.dispatch('uploadImages', customerId);

        context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Cleaning up. Please wait...'});

        await context.dispatch('customer/clearStateFromLocalStorage');
        await context.dispatch('addresses/clearStateFromLocalStorage');
        await context.dispatch('contacts/clearStateFromLocalStorage');

        await http.rawGet(baseURL + '/app/site/hosting/scriptlet.nl', {
            script: 1789,
            deploy: 1,
            custid: customerId,
            role: context.getters['user/role'],
        }, {noErrorPopup: true})

        newCustomerId = customerId;

        context.commit('displayInfoGlobalModal', {
            title: 'Saving complete',
            message: 'A new lead has been created. What would you like to do?',
            persistent: true,
            buttons: [
                {color: 'green darken-1', text: 'Enter Another Lead', action: 'dlgActionReload'},
                'spacer',
                {color: 'green darken-1', text: 'View new Lead\'s record', action: 'dlgActionViewRecord'},
            ]
        })
    },
    uploadImages : async (context, customerId) => {
        try {
            if (context.state.imageUploader.data.length && customerId) {
                context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Uploading file. Please wait...'});

                let epochTime = new Date().getTime();
                let dateStr = new Date().toISOString().split('T')[0].split('-').join('_');

                for (const [index, data] of context.state.imageUploader.data.entries()) {
                    let [, extension] = data.name.split('.');
                    let base64FileContent = await readFileAsBase64(data);
                    let fileName = `${dateStr}_${customerId}_${epochTime}_${index}.${extension}`;

                    context.commit('displayBusyGlobalModal', {
                        title: 'Processing',
                        message: `Uploading files (${index + 1}/${context.state.imageUploader.data.length}). Please wait...`,
                        progress: Math.ceil(((index) / context.state.imageUploader.data.length * 100))
                    });

                    await http.post('uploadImage', {base64FileContent, fileName}, {noErrorPopup: true});
                }

                context.commit('displayInfoGlobalModal', {title: 'Complete', message: 'Files are saved.'});
            }
        } catch (e) { console.error(e); } // TODO: report error via email
    },

    dlgActionReload : () => {
        top.location.reload();
    },
    dlgActionViewRecord : () => {
        if (newCustomerId) top.location.href = baseURL + '/app/common/entity/custjob.nl?id=' + newCustomerId;
    }
};

function _checkNetSuiteEnv() {
    if (parent['getCurrentNetSuiteUrl']) {
        return parent.getCurrentNetSuiteUrl().includes(baseURL);
    } else return false;
}

function _readUrlParams(context) {
    let currentUrl = parent['getCurrentNetSuiteUrl'] ? parent.getCurrentNetSuiteUrl() : window.location.href;
    let [, queryString] = currentUrl.split('?');

    const params = new Proxy(new URLSearchParams(`?${queryString}`), {
        get: (searchParams, prop) => searchParams.get(prop),
    });

    if (params['custid']) context.commit('customer/setInternalId', params['custid']);
    else if (params['custparam_params']) {
        let customParams = JSON.parse(params['custparam_params']);
        context.commit('customer/setInternalId', customParams['custid'] || null);
    }

    context.state.testMode = !!params['testMode'];
}

const store = new Vuex.Store({
    state,
    mutations,
    actions,
    getters,
    modules,
});

export default store;