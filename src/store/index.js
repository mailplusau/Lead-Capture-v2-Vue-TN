import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';
import getNSModules from '../utils/ns-modules';

Vue.use(Vuex)

const state = {
    errorNoNSModules: true,
    industries: [],
    leadSources: [],
    franchisees: [],
    statuses: [
        {value: 6, text: 'SUSPECT - New'},
        {value: 57, text: 'SUSPECT - Hot Lead'}
    ],
};

const getters = {
    ERROR_NO_NS_MODULES : state => state.errorNoNSModules,
    industries : state => state.industries,
    leadSources : state => state.leadSources,
    franchisees : state => state.franchisees,
    statuses : state => state.statuses,
};

const mutations = {

};

const actions = {
    init : async (context) => {
        try {
            await getNSModules();
            console.log('NS_MODULES found !');
            context.state.errorNoNSModules = false;
            await Promise.allSettled([
                context.dispatch('getIndustries'),
                context.dispatch('getLeadSources'),
                context.dispatch('getFranchisees'),
            ])
            context.dispatch('customer/init').then();
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
