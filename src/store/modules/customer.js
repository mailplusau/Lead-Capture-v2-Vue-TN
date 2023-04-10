import getNSModules from '../../utils/ns-modules';
import moment from 'moment-timezone';
import 'moment/locale/en-au';

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
    busy: false,
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

            custentity_customer_pricing_notes: '', // Pricing Notes
        },
        franchisee: {
            companyname: null, // Franchisee name
            custentity3: null, // Main contact name
            email: null, // Franchisee email
            custentity2: null, // Main contact phone
            custentity_abn_franchiserecord: null, // Franchise ABN
        },
        formDisabled: true,
    },

    mpExInfo: {
        form: {},
        data: {
            custentity_mpex_customer: false, // is MPEX Customer
            custentity_exp_mpex_weekly_usage: null, // MPEX Expected Usage
            custentity_form_mpex_usage_per_week: null, // MPEX Weekly Usage
        },
        formDisabled: true,
        weeklyUsageOptions: [],
        weeklyUsageTable: [],
    },

    surveyInfo: {
        form: {},
        data: {
            custentity_category_multisite: null, // is Multisite
            custentity_category_multisite_link: '', // Multisite Link
            custentity_mp_toll_zeevisit: null, // is Visited by Franchisee
            custentity_mp_toll_zeevisit_memo: '', // Franchisee Visit Note
            custentity_ap_mail_parcel: null, // is Using Mail/Parcel/Satchel Regularly
            custentity_customer_express_post: null, // is Using Express Post
            custentity_customer_local_couriers: null, // is Using Local Couriers
            custentity_customer_po_box: null, // is Using PO Box
            custentity_customer_bank_visit: null, // is Using Bank Visit
            custentity_lead_type: null, // Lead Type or Classify Lead
        },
        formDisabled: true,
        usageFrequencyOptions: [],
        classifyLeadOptions: [],
    },

    invoices: {
        data: [
            // { "id": 4196554,"status_text": "Paid In Full", "invoice_type": "", "invoice_link": "#", "statusref": "paidInFull", "trandate": "31/12/2022", "invoicenum": "Invoice #INV1050668", "amountremaining": ".00", "total": "448.68", "duedate": "15/03/2023" },
            // { "id":4220468,"status_text": "Paid In Full", "invoice_type": "", "invoice_link": "#", "statusref": "paidInFull", "trandate": "31/01/2023", "invoicenum": "Invoice #INV1055261", "amountremaining": ".00", "total": "433.62", "duedate": "15/02/2023" },
            // { "id":4254837,"status_text": "Paid In Full", "invoice_type": "", "invoice_link": "#", "statusref": "paidInFull", "trandate": "28/02/2023", "invoicenum": "Invoice #INV1063976", "amountremaining": ".00", "total": "403.51", "duedate": "21/01/2024" }
        ],
        loading: false,
        status: null,
        statuses: [
            {value: null, text: '-- None --'},
            {value: 'CustInvc:A', text: 'Open Invoices'},
            {value: 'CustInvc:B', text: 'Paid In Full'}
        ],
        period: null,
        periods: [
            {value: null, text: '-- None --'},
            {
                value: moment().tz('Australia/Sydney').subtract(7, 'days').format('DD/MM/YYYY').toString(),
                text: 'Last 7 Days'
            },
            {
                value: moment().tz('Australia/Sydney').subtract(1, 'months').format('DD/MM/YYYY').toString(),
                text: 'Last Month'
            },
            {
                value: moment().tz('Australia/Sydney').subtract(3, 'months').format('DD/MM/YYYY').toString(),
                text: 'Last 3 Months'
            },
            {
                value: moment().tz('Australia/Sydney').subtract(6, 'months').format('DD/MM/YYYY').toString(),
                text: 'Last 6 Months'
            },
        ]
    },

    accountManagers: [
        {value: 668711, text: 'Lee Russell'},
        {value: 696160, text: 'Kerina Helliwell'},
        {value: 690145, text: 'David Gdanski'},
        {value: 668712, text: 'Belinda Urbani'},
    ],
    yesNoOptions: [],
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
    additionalInfoFormDisabled : state => state.additionalInfo.formDisabled,
    showAdditionalInfoSection : (state, getters, rootState) => {
        let roles = [...financeRole, ...dataSysCoordinatorRole, ...mpAdminRole, ...adminRole];
        return rootState.userRole &&
            roles.includes(parseInt(rootState.userRole)) &&
            parseInt(state.details.entitystatus) === 13 && state.internalId;
    },

    mpExInfo : state => state.mpExInfo,
    surveyInfo : state => state.surveyInfo,
    showExtraTabsSection : (state, getters, rootState, rootGetters) => {
        return rootGetters['addresses/all'].length > 0 && state.internalId;
    },

    invoices : state => state.invoices.data,
    invoicesLoading : state => state.invoices.loading,
    invoiceStatus : state => state.invoices.status,
    invoicesStatuses : state => state.invoices.statuses,
    invoicePeriod : state => state.invoices.period,
    invoicesPeriods : state => state.invoices.periods,
    showInvoicesSection : (state) => {
        return !!state.internalId;
    },

    yesNoOptions : state => state.yesNoOptions,
};

const mutations = {
    setBusy : (state, busy = true) => { state.busy = busy; },

    resetDetailForm : state => { state.detailForm = {...state.details}; },
    disableDetailForm : (state, disabled = true) => { state.detailFormDisabled = disabled; },

    resetAdditionalInfoForm : state => { state.additionalInfo.form = {...state.additionalInfo.data}; },
    disableAdditionalInfoForm : (state, disabled = true) => { state.additionalInfo.formDisabled = disabled; },

    setInvoicesStatus : (state, status) => { state.invoices.status = status; },
    setInvoicesPeriod : (state, period) => { state.invoices.period = period; },

    resetMpExInfoForm : state => { state.mpExInfo.form = {...state.mpExInfo.data}; },

    resetSurveyInfoForm : state => { state.surveyInfo.form = {...state.surveyInfo.data}; },
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
            context.dispatch('getMpExInfo', NS_MODULES),
            context.dispatch('getYesNoOptions', NS_MODULES),
            context.dispatch('getSurveyInfo', NS_MODULES),
            context.dispatch('addresses/init', NS_MODULES, {root: true}),
            context.dispatch('contacts/init', NS_MODULES, {root: true}),
            context.dispatch('services/init', NS_MODULES, {root: true}),
            context.dispatch('item-pricing/init', NS_MODULES, {root: true}),
            context.dispatch('product-pricing/init', NS_MODULES, {root: true}),
            context.dispatch('user-notes/init', NS_MODULES, {root: true}),
        ]);

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

            for (let fieldId in context.state.mpExInfo.data)
                context.state.mpExInfo.data[fieldId] = customerRecord.getValue({ fieldId });

            for (let fieldId in context.state.surveyInfo.data)
                context.state.surveyInfo.data[fieldId] = customerRecord.getValue({ fieldId });

            _getFranchiseInfo(context, NS_MODULES, context.state.details.partner);

            context.commit('disableDetailForm');
        }

        context.commit('resetDetailForm');
        context.commit('resetAdditionalInfoForm');
        context.commit('resetMpExInfoForm');
        context.commit('resetSurveyInfoForm');
    },
    getInvoices : async context => {
        if (!context.state.internalId || !context.state.invoices.status || !context.state.invoices.period || context.rootState.errorNoNSModules)
            return;

        console.log('getting invoices...');
        context.state.invoices.loading = true;

        setTimeout(async () => {
            let { search, format } = await getNSModules();
            let invoicesSearch = search.load({
                id: 'customsearch_mp_ticket_invoices_datatabl',
                type: search.Type.INVOICE
            });
            let invoicesFilterExpression = invoicesSearch.filterExpression;
            invoicesFilterExpression.push('AND', ['entity', search.Operator.IS,
                context.state.internalId
            ]);

            invoicesFilterExpression.push('AND', ["status", search.Operator.ANYOF,
                context.state.invoices.status
            ]);

            invoicesFilterExpression.push('AND', ["trandate", search.Operator.AFTER,
                format.format({
                    value: context.state.invoices.period,
                    type: format.Type.DATE
                })
            ]);

            invoicesSearch.filterExpression = invoicesFilterExpression;
            let invoicesSearchResults = invoicesSearch.run();

            context.state.invoices.data.splice(0);
            let fieldIds = ['statusref', 'trandate', 'invoicenum', 'amountremaining', 'total', 'duedate'];
            invoicesSearchResults.each(function (invoiceResult) {
                let tmp = {};

                for (let fieldId of fieldIds)
                    tmp[fieldId] = invoiceResult.getValue(fieldId);

                tmp['status_text'] = invoiceResult.getText('statusref');
                tmp['invoice_type'] = invoiceResult.getText('custbody_inv_type');
                tmp['invoice_link'] = _getInvoiceURL(invoiceResult.id);
                tmp['id'] = invoiceResult.id;

                tmp['trandate'] = moment(tmp['trandate'], 'D/M/YYYY').format('DD/MM/YYYY').toString();
                tmp['duedate'] = moment(tmp['duedate'], 'D/M/YYYY').format('DD/MM/YYYY').toString();

                context.state.invoices.data.push(tmp);

                return true;
            });

            context.state.invoices.loading = false;
        }, 150);
    },
    getMpExInfo : (context, NS_MODULES) => {
        if (!context.state.internalId) return;

        NS_MODULES.search.create({
            type: 'customlist_form_mpex_usage_per_week',
            columns: [ {name: 'name'}, {name: 'internalId'} ]
        }).run().each(item => {
            context.state.mpExInfo.weeklyUsageOptions.push({ value: item.getValue('internalId'), text: item.getValue('name') });
            return true;
        })


        let customerSearch = NS_MODULES.search.load({
            id: 'customsearch_customer_mpex_weekly_usage',
            type: 'customer'
        });

        customerSearch.filters.push(NS_MODULES.search.createFilter({
            name: 'internalid',
            operator: NS_MODULES.search.Operator.IS,
            values: context.state.internalId
        }));

        customerSearch.run().each(item => {
            let weeklyUsage = item.getValue('custentity_actual_mpex_weekly_usage');

            let parsedUsage = JSON.parse(weeklyUsage);

            for (let x = 0; x < parsedUsage['Usage'].length; x++) {
                let parts = parsedUsage['Usage'][x]['Week Used'].split('/');

                context.state.mpExInfo.weeklyUsageTable.push({
                    col1: parts[2] + '-' + ('0' + parts[1]).slice(-2) + '-' + ('0' + parts[0]).slice(-2),
                    col2: parsedUsage['Usage'][x]['Count']
                })
            }

            return true;
        })
    },
    getSurveyInfo : (context, NS_MODULES) => {
        if (!context.state.internalId) return;

        NS_MODULES.search.create({
            type: 'customlist_usage_frequency',
            columns: [{
                name: 'name'
            }, {
                name: 'internalId'
            }]
        }).run().each(item => {
            context.state.surveyInfo.usageFrequencyOptions.push({
                value: item.getValue('internalId'),
                text: item.getValue('name')
            });

            return true;
        });

        NS_MODULES.search.create({
            type: 'customlist_classify_lead',
            columns: [{
                name: 'name'
            }, {
                name: 'internalId'
            }]
        }).run().each(item => {
            context.state.surveyInfo.classifyLeadOptions.push({
                value: item.getValue('internalId'),
                text: item.getValue('name')
            });

            return true;
        });
    },
    getYesNoOptions : (context, NS_MODULES) => {
        if (!context.state.internalId) return;

        NS_MODULES.search.create({
            type: 'customlist107_2',
            columns: [ {name: 'name'}, {name: 'internalId'} ]
        }).run().each(item => {
            context.state.yesNoOptions.push({ value: item.getValue('internalId'), text: item.getValue('name') });
            return true;
        })
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
    saveMpExInfo : context => {
        context.commit('setBusy');
        context.state.mpExInfo.formDisabled = true;
        _displayBusyGlobalModal(context);

        setTimeout(async () => {
            context.state.mpExInfo.data = {...context.state.mpExInfo.form};

            let NS_MODULES = await getNSModules();

            let customerRecord = NS_MODULES.record.load({
                type: NS_MODULES.record.Type.CUSTOMER,
                id: context.state.internalId,
                isDynamic: true
            });

            for (let fieldId in context.state.mpExInfo.data)
                customerRecord.setValue({fieldId, value: context.state.mpExInfo.data[fieldId]});

            customerRecord.save({ignoreMandatoryFields: true});

            await context.dispatch('getDetails', NS_MODULES);

            context.commit('setBusy', false);
            _displayBusyGlobalModal(context, false);
        }, 250);
    },
    saveSurveyInfo : context => {
        context.state.surveyInfo.formDisabled = true;
        _displayBusyGlobalModal(context);

        setTimeout(async () => {
            let NS_MODULES = await getNSModules();

            try {

                let customerRecord = NS_MODULES.record.load({
                    type: NS_MODULES.record.Type.CUSTOMER,
                    id: context.state.internalId,
                    isDynamic: true
                });

                for (let fieldId in context.state.surveyInfo.data)
                    customerRecord.setValue({fieldId, value: context.state.surveyInfo.form[fieldId]});

                customerRecord.save({ignoreMandatoryFields: true});

                await context.dispatch('getDetails', NS_MODULES);

                _displayBusyGlobalModal(context, false);
            } catch (e) {
                console.log(e);
                _displayErrorGlobalModal(context, 'Error while saving', e.message);
            }
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
    context.rootState.globalModal.persistent = false;
    context.rootState.globalModal.isError = false;
}

function _displayErrorGlobalModal(context, title, message) {
    context.rootState.globalModal.title = title;
    context.rootState.globalModal.body = message;
    context.rootState.globalModal.busy = false;
    context.rootState.globalModal.open = true;
    context.rootState.globalModal.persistent = true;
    context.rootState.globalModal.isError = true;
}

function _getInvoiceURL(invoice_id) {
    let baseURL = 'https://1048144.app.netsuite.com';
    let compid = '1048144';
    return baseURL + '/app/accounting/transactions/custinvc.nl?id=' + invoice_id +
    '&compid=' + compid + '&cf=116&whence=';
}

export default {
    state,
    getters,
    actions,
    mutations
};