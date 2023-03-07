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
    disableDetailForm : (state, disabled = true) => { state.detailFormDisabled = disabled; },
}

let actions = {
    init : async (context) => {
        context.commit('setBusy');

        const params = new Proxy(new URLSearchParams(window.location.search), {
            get: (searchParams, prop) => searchParams.get(prop),
        });

        context.state.internalId = params['custid'] || null;

        let NS_MODULES = await getNSModules();

        await Promise.allSettled([
            context.dispatch('getDetails', NS_MODULES),
            context.dispatch('addresses/init', NS_MODULES, {root: true}),
            context.dispatch('contacts/init', NS_MODULES, {root: true}),
        ])

        context.commit('setBusy', false);
    },
    getDetails : (context, NS_MODULES) => {
        if (!context.state.internalId) {
            context.commit('disableDetailForm', false);
            return;
        }

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
    },
    saveCustomer : context => {
        context.commit('setBusy');
        context.commit('disableDetailForm');
        // TODO: save this to NetSuite
        setTimeout(async () => {
            context.state.details = {...context.state.detailForm};
            let NS_MODULES = await getNSModules();
            let customerRecord = NS_MODULES.record.load({
                type: NS_MODULES.record.Type.CUSTOMER,
                id: context.state.internalId,
                isDynamic: true
            });

            for (let fieldId in context.state.details) {
                customerRecord.setValue({fieldId, value: context.state.details[fieldId]});
            }

            customerRecord.save({ignoreMandatoryFields: true});

            await context.dispatch('getDetails', NS_MODULES);

            context.commit('setBusy', false);
        }, 250);
    }
};


export default {
    state,
    getters,
    actions,
    mutations
};