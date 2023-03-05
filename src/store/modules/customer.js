import getNSModules from '../../utils/ns-modules';

const state = {
    internalId: null, // this is the customer ID
    busy: true,
    details: {
        companyname: '',
        vatregnumber: '',
        email: '',
        altphone: '',
        phone: '',
        custentity_email_service: '',
        custentity_industry_category: '',
        leadsource: '',
        partner: '',
        entitystatus: '',
    },
    detailForm: {},
    detailFormValid: false,
    detailFormDisabled: true,
};

let getters = {
    internalId : state => state.internalId,
    busy : state => state.busy,
    details : state => state.details,
    detailForm : state => state.detailForm,
    detailFormValid : state => state.detailFormValid,
    detailFormDisabled : state => state.detailFormDisabled,

};

const mutations = {
    setBusy : (state, busy = true) => { state.busy = busy; },

    resetDetailForm : state => { state.detailForm = {...state.details}; },
    disableDetailForm : (state, disabled = true) => { state.detailFormDisabled = disabled; }
}

let actions = {
    init : async (context) => {
        context.commit('setBusy');

        const params = new Proxy(new URLSearchParams(window.location.search), {
            get: (searchParams, prop) => searchParams.get(prop),
        });

        context.state.internalId = params['custid'] || null;

        // TODO: fetch customer's data
        if (context.state.internalId) {
            let NS_MODULES = await getNSModules();

            let customerRecord = NS_MODULES.record.load({
                type: NS_MODULES.record.Type.CUSTOMER,
                id: context.state.internalId,
                isDynamic: true
            });

            for (let fieldId in context.state.details) {
                context.state.details[fieldId] = customerRecord.getValue({ fieldId });
            }
            context.commit('resetDetailForm');
            context.commit('disableDetailForm');
        } else context.commit('disableDetailForm', false);

        context.commit('setBusy', false);
    },
    saveCustomer : context => {
        context.commit('setBusy');
        context.commit('disableDetailForm');
        context.state.details = {...context.state.detailForm};
        // TODO: save this to NetSuite
        context.commit('setBusy', false);

    }
};


export default {
    state,
    getters,
    actions,
    mutations
};