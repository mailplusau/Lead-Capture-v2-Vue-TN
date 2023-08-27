import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';
import getNSModules from '../utils/ns-modules';
import axios from 'axios';

Vue.use(Vuex)

const state = {
    errorNoNSModules: true,
    userRole: null,
    userId: null,
    testMode: false,
    globalModal: {
        open: false,
        title: '',
        body: '',
        busy: false,
        persistent: true,
        isError: false
    },
    industries: [],
    leadSources: [],
    franchisees: [],
    roles: [],
    statuses: [
        {value: 6, text: 'SUSPECT - New'},
        {value: 57, text: 'SUSPECT - Hot Lead'},
        {value: 13, text: 'CUSTOMER - Signed'},
    ],
    states: [
        {value: 1, text: 'NSW'},
        {value: 2, text: 'QLD'},
        {value: 3, text: 'VIC'},
        {value: 4, text: 'SA'},
        {value: 5, text: 'TAS'},
        {value: 6, text: 'ACT'},
        {value: 7, text: 'WA'},
        {value: 8, text: 'NT'},
        {value: 9, text: 'NZ'},
    ],
    invoiceMethods: [],
    invoiceCycles: [],
    terms: [
        {value: 5, text: '1% 10 Net 30'},
        {value: 6, text: '2% 10 Net 30'},
        {value: 4, text: 'Due On Receipt'},
        {value: 7, text: 'Net 7 Days'},
        {value: 1, text: 'Net 15 Days'},
        {value: 2, text: 'Net 30 Days'},
        {value: 8, text: 'Net 45 Days'},
        {value: 3, text: 'Net 60 Days'},
        {value: 8, text: 'Net 90 Days'},
    ]
};

const getters = {
    ERROR_NO_NS_MODULES : state => state.errorNoNSModules,
    industries : state => state.industries,
    leadSources : state => state.leadSources,
    franchisees : state => state.franchisees.filter(item => item.text.toLowerCase().substring(0, 4) !== 'old '),
    roles : state => state.roles,
    statuses : state => state.statuses,
    states : state => state.states,
    globalModal : state => state.globalModal,
    userRole : state => state.userRole,
    userId : state => state.userId,
    testMode : state => state.testMode,
    invoiceMethods : state => state.invoiceMethods,
    invoiceCycles : state => state.invoiceCycles,
    terms : state => state.terms,
};

const mutations = {
    setGlobalModal :  (state, open = true) => { state.globalModal.open = open; },
    displayErrorGlobalModal : (state, {title, message}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = false;
        state.globalModal.open = true;
        state.globalModal.persistent = true;
        state.globalModal.isError = true;
    }
};

const actions = {
    init : async (context) => {
        try {
            const params = new Proxy(new URLSearchParams(window.location.search), {
                get: (searchParams, prop) => searchParams.get(prop),
            });

            context.state.testMode = !!params['testMode'];
            document.querySelector('h1.uir-record-type').innerHTML = '';
            await getNSModules();
            console.log('NS_MODULES found !');
            context.state.errorNoNSModules = false;
            setTimeout(async () => {
                await Promise.allSettled([
                    context.dispatch('getIndustries'),
                    context.dispatch('getLeadSources'),
                    context.dispatch('getFranchisees'),
                    context.dispatch('getRoles'),
                    context.dispatch('getUserRole'),
                    context.dispatch('getInvoiceMethods'),
                    context.dispatch('getInvoiceCycles'),
                ])
                context.dispatch('customer/init').then();
            }, 150)
        } catch (e) {
            console.log(e);
            context.state.errorNoNSModules = true;
        }
    },
    getIndustries : async (context) => {
        await _fetchDataForHtmlSelect(context, context.state.industries,
            null, 'customlist_industry_category', 'internalId', 'name');
    },
    getLeadSources : async (context) => {
        await _fetchDataForHtmlSelect(context, context.state.leadSources,
            'customsearch_lead_source', 'campaign', 'internalId', 'title');
    },
    getFranchisees : async (context) => {
        await _fetchDataForHtmlSelect(context, context.state.franchisees,
            'customsearch_salesp_franchisee', 'partner', 'internalId', 'companyname');
    },
    getRoles : async context => {
        await _fetchDataForHtmlSelect(context, context.state.roles,
            'customsearch_salesp_contact_roles', 'contactrole', 'internalId', 'name');
    },
    getUserRole : async context => {
        let NS_MODULES = await getNSModules();

        context.state.userRole = context.state.testMode ? 1000 : parseInt(NS_MODULES.runtime.getCurrentUser().role);
        context.state.userId = context.state.testMode ? 779884 : parseInt(NS_MODULES.runtime.getCurrentUser().id);
    },
    getInvoiceMethods : async context => {
        await _fetchDataForHtmlSelect(context, context.state.invoiceMethods,
            null, 'customlist_invoice_method', 'internalId', 'name');
    },
    getInvoiceCycles : async context => {
        await _fetchDataForHtmlSelect(context, context.state.invoiceCycles,
            null, 'customlist_invoicing_cyle', 'internalId', 'name');
    },
    redirectToNetSuiteCustomerPage : context => {
        if (context.rootGetters['customer/internalId'])
            window.location.href = 'https://1048144.app.netsuite.com/app/common/entity/custjob.nl?id=' + context.rootGetters['customer/internalId'];
    },

    saveNewCustomer : async context => {
        if (!context.getters['addresses/all'].length) {
            context.commit('displayErrorGlobalModal', {title: 'Missing Address', message: 'Please add at least 1 address for this lead'})
            return;
        }

        if (context.state.userRole === 1000 && context.getters['customer/detailForm'].entitystatus === 57 && !context.getters['contacts/all'].length) {
            context.commit('displayErrorGlobalModal', {title: 'Missing Contact', message: 'Please add at least 1 contact for this lead'})
            return;
        }

        if (context.state.testMode)
            console.log('Creating new customer!')
        else {
            context.state.globalModal.title = 'New Customer';
            context.state.globalModal.body = 'Creating New Customer. Please Wait...';
            context.state.globalModal.busy = true;
            context.state.globalModal.open = true;

            let customerId = await context.dispatch('customer/saveNewCustomer');
            console.log('New customer id is ', customerId);

            await Promise.allSettled([
                context.dispatch('addresses/saveAddressesToNewCustomer', customerId),
                context.dispatch('contacts/saveContactsToNewCustomer', customerId)
            ]);

            await _createProductPricing(context, customerId);

            let count = 0;
            let tmp = setInterval(() => {
                context.state.globalModal.body = 'New Customer Created! Redirecting in ' + (3-count) + '...';
                if (count >= 3) {
                    clearInterval(tmp);
                    // window.location.href = 'https://1048144.app.netsuite.com/app/site/hosting/scriptlet.nl?script=1706&deploy=1&custid=' + customerId;
                    window.location.href = 'https://1048144.app.netsuite.com/app/common/entity/custjob.nl?id=' + customerId;
                } else count++;
            }, 1000)
        }
    }

};

async function _fetchDataForHtmlSelect(context, stateObject, id, type, valueColumnName, textColumnName) {
    if (context.state.errorNoNSModules) return;
    
    stateObject.splice(0);
    
    let NS_MODULES = await getNSModules();
    let searchObj = NS_MODULES.search.create({
        id, type,
        columns: [{name: valueColumnName}, {name: textColumnName}]
    });
    searchObj.run().each(result => {
        stateObject.push({value: result.getValue(valueColumnName), text: result.getValue(textColumnName)});
        return true;
    });
}

async function _createProductPricing(context, customerId) {
    let index = context.rootGetters['addresses/all'].findIndex(item => item.defaultshipping);

    if (index >= 0) {
        let address = context.rootGetters['addresses/all'][index];
        await axios.get(window.location.href, {
            params: {
                requestData: JSON.stringify({
                    operation: 'createProductPricing',
                    data: {
                        customerId,
                        city: address.city,
                        postcode: address.zip
                    }
                })
            }
        });
    }
}

const store = new Vuex.Store({
    state,
    mutations,
    actions,
    getters,
    modules,
});

export default store;
