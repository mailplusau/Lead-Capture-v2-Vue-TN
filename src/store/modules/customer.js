import getNSModules from '../../utils/ns-modules';

// 1001, 1031 and 1023 are finance roles
// 1032 is the Data Systems Co-ordinator role
// 1006 is the Mail Plus Administration role.
// 3 is the Administrator role.
const financeRole = [1001, 1031, 1023];
const dataSysCoordinatorRole = [1032];
const mpAdminRole = [1006];
const adminRole = [3];

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

        custentity_mp_toll_salesrep: '', // Account Manager ID

        custentity_service_fuel_surcharge: 1, // 1: yes, 2: no, 3: not included
        custentity_service_fuel_surcharge_percen: 9.5, // 9.5% is default

        custentity_maap_bankacctno: null,
        custentity_maap_bankacctno_parent: null,
    },
    detailForm: {},
    detailFormValid: false,
    detailFormDisabled: true,

    additionalInfo: {
        form: {},
        data: {
            custentity_invoice_method: null, // Invoice method
            custentity_accounts_cc_email: null, // Account CC email
            custentity_mpex_po: null, // MPEX PO
            custentity11: null, // Customer PO number
            custentity_mpex_invoicing_cycle: null, // Invoice cycle ID
            terms: null, // Term(?)
            custentity_finance_terms: null, // Customer's Term
        },
        franchisee: {
            companyname: null, // Franchisee name
            custentity3: null, // Main contact name
            email: null, // Franchisee email
            custentity2: null, // Main contact phone
            custentity_abn_franchiserecord: null, // Franchise ABN
        },
        formValid: false,
        formDisabled: true,
    },

    accountManagers: [
        {value: 668711, text: 'Lee Russell'},
        {value: 696160, text: 'Kerina Helliwell'},
        {value: 690145, text: 'David Gdanski'},
        {value: 668712, text: 'Belinda Urbani'},
    ]
};

let getters = {
    internalId : state => state.internalId,
    busy : state => state.busy,
    details : state => state.details,
    detailForm : state => state.detailForm,
    detailFormValid : state => state.detailFormValid,
    detailFormDisabled : state => state.detailFormDisabled,
    accountManagers : state => state.accountManagers,
    franchisee : state => state.additionalInfo.franchisee,

    additionalInfoForm : state => state.additionalInfo.form,
    additionalInfoFormValid : state => state.additionalInfo.formValid,
    additionalInfoFormDisabled : state => state.additionalInfo.formDisabled,

    showAdditionalInfoSection : (state, getters, rootState) => {
        let roles = [...financeRole, ...dataSysCoordinatorRole, ...mpAdminRole, ...adminRole];
        return rootState.userRole &&
            roles.includes(parseInt(rootState.userRole)) &&
            parseInt(state.details.entitystatus) === 13;
    },
};

const mutations = {
    setBusy : (state, busy = true) => { state.busy = busy; },

    resetDetailForm : state => { state.detailForm = {...state.details}; },
    disableDetailForm : (state, disabled = true) => { state.detailFormDisabled = disabled; },

    resetAdditionalInfoForm : state => { state.additionalInfo.form = {...state.additionalInfo.data}; },
    disableAdditionalInfoForm : (state, disabled = true) => { state.additionalInfo.formDisabled = disabled; },
}

let actions = {
    init : async (context) => {
        context.commit('setBusy');

        const params = new Proxy(new URLSearchParams(window.location.search), {
            get: (searchParams, prop) => searchParams.get(prop),
        });

        if (params['custid']) context.state.internalId = params['custid'];
        else if (params['custparam_params']) {
            let customParams = JSON.parse(params['custparam_params']);
            context.state.internalId = customParams['custid'] || null;
        }

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

            for (let fieldId in context.state.details)
                context.state.details[fieldId] = customerRecord.getValue({ fieldId });

            for (let fieldId in context.state.additionalInfo.data)
                context.state.additionalInfo.data[fieldId] = customerRecord.getValue({ fieldId });

            _getFranchiseInfo(context, NS_MODULES, context.state.details.partner);

            context.commit('disableDetailForm');
        }

        context.commit('resetDetailForm');
        context.commit('resetAdditionalInfoForm');
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
        _displayBusyGlobalModal(context);

        setTimeout(async () => {
            context.state.details = {...context.state.detailForm};
            let NS_MODULES = await getNSModules();
            let customerRecord = NS_MODULES.record.load({
                type: NS_MODULES.record.Type.CUSTOMER,
                id: context.state.internalId,
                isDynamic: true
            });

            for (let fieldId in context.state.details)
                customerRecord.setValue({fieldId, value: context.state.details[fieldId]});

            customerRecord.save({ignoreMandatoryFields: true});

            _updateOldCustomer(NS_MODULES, context, context.state.internalId);

            await context.dispatch('getDetails', NS_MODULES);

            context.commit('setBusy', false);
            _displayBusyGlobalModal(context, false);
        }, 250);
    },
    saveAdditionalInfo : context => {
        context.commit('setBusy');
        context.commit('disableAdditionalInfoForm');
        _displayBusyGlobalModal(context);

        setTimeout(async () => {
            context.state.additionalInfo.data = {...context.state.additionalInfo.form};
            let NS_MODULES = await getNSModules();
            let customerRecord = NS_MODULES.record.load({
                type: NS_MODULES.record.Type.CUSTOMER,
                id: context.state.internalId,
                isDynamic: true
            });

            for (let fieldId in context.state.additionalInfo.data)
                customerRecord.setValue({fieldId, value: context.state.additionalInfo.data[fieldId]});

            customerRecord.save({ignoreMandatoryFields: true});

            await context.dispatch('getDetails', NS_MODULES);

            context.commit('setBusy', false);
            _displayBusyGlobalModal(context, false);
        }, 250);
    },

    saveNewCustomer : (context) => {
        return new Promise(resolve => {
            setTimeout(async () => {
                let NS_MODULES = await getNSModules();
                context.state.details = {...context.state.detailForm};
                let customerRecord = NS_MODULES.record.create({
                    type: NS_MODULES.record.Type.LEAD,
                });

                for (let fieldId in context.state.details)
                    customerRecord.setValue({fieldId, value: context.state.details[fieldId]});

                let customerId = customerRecord.save({ignoreMandatoryFields: true});

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

function _getFranchiseInfo(context, NS_MODULES, franchiseId) {
    if (!franchiseId) return;

    let franchiseeRecord = NS_MODULES.record.load({
        type: NS_MODULES.record.Type.PARTNER,
        id: franchiseId,
    });

    for (let fieldId in context.state.additionalInfo.franchisee)
        context.state.additionalInfo.franchisee[fieldId] = franchiseeRecord.getValue({fieldId})
}

function _displayBusyGlobalModal(context, open = true) {
    context.rootState.globalModal.title = 'Existing Customer';
    context.rootState.globalModal.body = 'Saving Customer\'s Details. Please Wait...';
    context.rootState.globalModal.busy = open;
    context.rootState.globalModal.open = open;
}

export default {
    state,
    getters,
    actions,
    mutations
};