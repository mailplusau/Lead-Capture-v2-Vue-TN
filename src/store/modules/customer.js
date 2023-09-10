import http from '@/utils/http';
import {VARS, baseURL} from '@/utils/utils.mjs';

const state = {
    id: null, // internal id of the customer from NetSuite
    details: {...VARS.customer.basicFields},
    detailTexts: {},
    form: {
        data: {},
        busy: false,
        disabled: false,
    },
};

state.form.data = {...state.details};

const getters = {
    form : state => state.form,
    id : state => state.id,

    isHotLead : state => state.id === null ? parseInt(state.form.data.entitystatus) === 57 : parseInt(state.details.entitystatus) === 57,
};

const mutations = {
    setInternalId : (state, id) => { state.id = id; },

    resetForm : state => { state.form.data = {...state.details}; },
    disableForm : (state, disabled = true) => { state.form.disabled = disabled; },
};

const actions = {
    init : async context => {
        await context.dispatch('getDetails');

        _checkFranchiseeMode(context);

        _updateFormTitleAndHeader(context);

        await context.dispatch('restoreStateFromLocalStorage');
    },
    getDetails : async (context) => {
        if (!context.state.id) return context.commit('disableForm', false);

        let integerFields = ['custentity_mp_toll_salesrep', 'entitystatus'];

        context.state.form.busy = true;
        let fieldIds = [];
        for (let fieldId in context.state.details) fieldIds.push(fieldId);

        let data = await http.get('getCustomerDetails', {
            customerId: context.state.id,
            fieldIds,
        });

        for (let fieldId in context.state.details) {
            context.state.details[fieldId] = integerFields.includes(fieldId) ? parseInt(data[fieldId]) : data[fieldId];
            context.state.detailTexts[fieldId] = data[fieldId + '_text'];
        }

        context.commit('resetForm');
        context.state.form.disabled = true;
        context.state.form.busy = false;
    },
    handleOldCustomerIdChanged : async (context) => {
        if (!context.state.form.data.custentity_old_customer) return;

        context.state.form.data.custentity_old_zee = await http.get('getFranchiseeOfCustomer', {
            customerId: context.state.form.data.custentity_old_customer,
        });
    },
    save : async context => {
        if (!context.state.id) return;

        context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Saving customer\'s details. Please wait...'}, {root: true});

        let fieldIds = [];
        for (let fieldId in context.state.details) fieldIds.push(fieldId);

        let data = await http.post('saveCustomerDetails', {
            customerId: context.state.id,
            customerData: {...context.state.form.data},
            fieldIds,
        });

        for (let fieldId in context.state.details)
            context.state.details[fieldId] = data[fieldId];

        context.commit('resetForm');
        context.state.form.disabled = true;
        context.commit('displayInfoGlobalModal', {title: 'Complete', message: 'Customer\'s details have been saved.'}, {root: true});
    },
    goToNetSuitePage : context => {
        context.commit('displayBusyGlobalModal', {
            title: 'Redirecting to...',
            message: `<b>${context.state.details.companyname}</b>`
        }, {root: true});
        top.location.href = baseURL + '/app/common/entity/custjob.nl?id=' + context.state.id;
    },

    saveStateToLocalStorage : async context => {
        top.localStorage.setItem("1763_customer", JSON.stringify(context.state.form.data));
    },
    clearStateFromLocalStorage : async () => {
        top.localStorage.removeItem("1763_customer");
    },
    restoreStateFromLocalStorage : async context => {
        if (context.state.id !== null) return;

        try {
            let data = JSON.parse(top.localStorage.getItem("1763_customer"));
            for (let fieldId in context.state.form.data)
                if (data[fieldId]) context.state.form.data[fieldId] = data[fieldId];
        } catch (e) {
            console.log('No stored data found')
        }
    }
};

function _updateFormTitleAndHeader(context) {
    let header;

    if (context.rootGetters['user/isFranchisee']) {
        header = 'Franchisee\'s Lead Capture';
    } else if (parseInt(context.state.details['entitystatus']) === 13) {
        header = 'Customer Details';
    } else if (context.state.id) {
        header = 'Prospect Details';
    } else {
        header = 'Prospect Capture Form';
    }

    context.commit('setPageTitle', header, {root: true});
}

function _checkFranchiseeMode(context) {
    if (!context.rootGetters['user/isFranchisee']) return;

    context.state.form.data.partner = `${context.rootGetters['user/id']}`;
    context.state.form.data.custentity_mp_toll_salesrep = context.rootGetters['user/salesRep'].id; // Sales Rep ID
    context.state.form.data.leadsource = '-4'; // Franchisee Generated
    context.state.form.data.custentity_industry_category = `${19}`; // Others
    context.state.form.data.entitystatus = 6; // SUSPECT-New
}

export default {
    state,
    getters,
    actions,
    mutations
};