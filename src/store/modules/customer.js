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
        custentity_old_zee: '',
        custentity_old_customer: '',
        custentity_new_zee: '',
        custentity_new_customer: '',

        custentity_service_fuel_surcharge: 1, // 1: yes, 2: no, 3: not included
        custentity_service_fuel_surcharge_percen: 9.5 // 9.5% is default
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
        } else {
            let customerRecord = NS_MODULES.record.load({
                type: NS_MODULES.record.Type.CUSTOMER,
                id: context.state.internalId,
                isDynamic: true
            });

            for (let fieldId in context.state.details) {
                context.state.details[fieldId] = customerRecord.getValue({ fieldId });
            }

            context.commit('disableDetailForm');
        }

        context.commit('resetDetailForm');
    },
    handleOldCustomerIdChanged : async (context) => {
        if (!context.state.detailForm.custentity_old_customer) return;

        let NS_MODULES = await getNSModules();

        let result = NS_MODULES.search.lookupFields({
            type: NS_MODULES.search.Type.CUSTOMER,
            id: context.state.detailForm.custentity_old_customer,
            columns: ['partner']
        });

        context.state.detailForm.custentity_old_zee = result.partner ? result.partner[0].value : '';
    },
    saveCustomer : context => {
        context.commit('setBusy');
        context.commit('disableDetailForm');

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

            _updateOldCustomer(NS_MODULES, context, context.state.internalId);

            await context.dispatch('getDetails', NS_MODULES);

            context.commit('setBusy', false);
        }, 250);
    },

    saveNewCustomer : (context) => {
        console.log('saving new customer...')
        console.log(context.state.detailForm);
        return new Promise(resolve => {
            setTimeout(async () => {
                let NS_MODULES = await getNSModules();
                context.state.details = {...context.state.detailForm};
                let customerRecord = NS_MODULES.record.create({
                    type: NS_MODULES.record.Type.LEAD,
                });

                for (let fieldId in context.state.details) {
                    customerRecord.setValue({fieldId, value: context.state.details[fieldId]});
                }

                let customerId = customerRecord.save({ignoreMandatoryFields: true});
                console.log('saving new customer done')

                _updateOldCustomer(NS_MODULES, context, customerId);

                resolve(customerId);
            }, 200);
        });
    }
};

function _updateOldCustomer(NS_MODULES, context, newCustomerId) {
    if (!context.state.details.custentity_old_customer) return;

    let oldCustomerRecord = NS_MODULES.record.load({
        type: NS_MODULES.record.Type.CUSTOMER,
        id: context.state.details.custentity_old_customer,
        isDynamic: true
    });

    oldCustomerRecord.setValue({fieldId: 'custentity_new_customer', value: newCustomerId});
    oldCustomerRecord.setValue({fieldId: 'custentity_new_zee', value: context.state.details.partner});

    oldCustomerRecord.save({ignoreMandatoryFields: true});
}


export default {
    state,
    getters,
    actions,
    mutations
};