import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';
import getNSModules from '../utils/ns-modules';

Vue.use(Vuex)

const state = {
    errorNoNSModules: true,
    globalModal: {
        open: false,
        title: '',
        body: '',
        busy: false,
    },
    industries: [],
    leadSources: [],
    franchisees: [],
    roles: [],
    statuses: [
        {value: 6, text: 'SUSPECT - New'},
        {value: 57, text: 'SUSPECT - Hot Lead'}
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
    globalModal : state => state.globalModal
};

const mutations = {
    setGlobalModal :  (state, open = true) => { state.globalModal.open = open; },
};

const actions = {
    init : async (context) => {
        try {
            await getNSModules();
            console.log('NS_MODULES found !');
            context.state.errorNoNSModules = false;
            setTimeout(async () => {
                await Promise.allSettled([
                    context.dispatch('getIndustries'),
                    context.dispatch('getLeadSources'),
                    context.dispatch('getFranchisees'),
                    context.dispatch('getRoles'),
                ])
                context.dispatch('customer/init').then();
            }, 250)
        } catch (e) {
            console.log(e);
            context.state.errorNoNSModules = true;
        }
    },
    getIndustries : async (context) => {
        if (context.state.errorNoNSModules) return;

        context.state.industries.splice(0);

        await _fetchDataForHtmlSelect(context.state.industries,
            null, 'customlist_industry_category', 'internalId', 'name');
    },
    getLeadSources : async (context) => {
        if (context.state.errorNoNSModules) return;

        context.state.leadSources.splice(0);

        await _fetchDataForHtmlSelect(context.state.leadSources,
            'customsearch_lead_source', 'campaign', 'internalId', 'title');
    },
    getFranchisees : async (context) => {
        if (context.state.errorNoNSModules) return;

        context.state.franchisees.splice(0);

        await _fetchDataForHtmlSelect(context.state.franchisees,
            'customsearch_salesp_franchisee', 'partner', 'internalId', 'companyname');
    },
    getRoles : async context => {
        if (context.state.errorNoNSModules) return;

        context.state.roles.splice(0);

        await _fetchDataForHtmlSelect(context.state.roles,
            'customsearch_salesp_contact_roles', 'contactrole', 'internalId', 'name');
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

async function _fetchDataForHtmlSelect(stateObject, id, type, valueColumnName, textColumnName) {
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
