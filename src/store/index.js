import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';
import getNSModules from '../utils/ns-modules';

Vue.use(Vuex)

const state = {
    errorNoNSModules: true,
    userRole: null,
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
    franchisees : state => state.franchisees,
    roles : state => state.roles,
    statuses : state => state.statuses,
    states : state => state.states,
    globalModal : state => state.globalModal,
    userRole : state => state.userRole,
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
            document.querySelector('h1.uir-record-type').setHTML('');
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
        context.state.userRole = NS_MODULES.runtime.getCurrentUser().role;
    },
    getInvoiceMethods : async context => {
        await _fetchDataForHtmlSelect(context, context.state.invoiceMethods,
            null, 'customlist_invoice_method', 'internalId', 'name');
    },
    getInvoiceCycles : async context => {
        await _fetchDataForHtmlSelect(context, context.state.invoiceCycles,
            null, 'customlist_invoicing_cyle', 'internalId', 'name');
    },

    saveNewCustomer : async context => {
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

        // context.state.globalModal.busy = false;
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


const store = new Vuex.Store({
    state,
    mutations,
    actions,
    getters,
    modules,
});

export default store;
