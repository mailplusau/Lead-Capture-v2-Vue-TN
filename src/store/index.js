import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';
import {baseURL} from '@/utils/utils.mjs';
import http from '@/utils/http';

Vue.use(Vuex)

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
        isError: false
    },
};

const getters = {
    globalModal : state => state.globalModal,
    testMode : state => state.testMode,
    pageTitle : state => state.pageTitle,
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
    },
    displayErrorGlobalModal: (state, {title, message}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = false;
        state.globalModal.open = true;
        state.globalModal.progress = -1;
        state.globalModal.persistent = true;
        state.globalModal.isError = true;
    },
    displayBusyGlobalModal: (state, {title, message, open = true, progress = -1}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = open;
        state.globalModal.open = open;
        state.globalModal.progress = progress;
        state.globalModal.persistent = true;
        state.globalModal.isError = false;
    },
    displayInfoGlobalModal: (state, {title, message, persistent = false}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = false;
        state.globalModal.open = true;
        state.globalModal.progress = -1;
        state.globalModal.persistent = persistent;
        state.globalModal.isError = false;
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

        customerData.custentity_email_service = customerData.custentity_email_service || 'abc@abc.com';
        customerData.custentity_date_lead_entered = new Date();

        let customerId = await http.post('saveBrandNewCustomer', {customerData, addressArray, contactArray});

        context.commit('displayBusyGlobalModal', {title: 'Redirecting', message: 'Saving complete. Redirecting to customer page...'});

        await context.dispatch('customer/clearStateFromLocalStorage');
        await context.dispatch('addresses/clearStateFromLocalStorage');
        await context.dispatch('contacts/clearStateFromLocalStorage');

        top.location.href = baseURL + '/app/common/entity/custjob.nl?id=' + customerId;
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