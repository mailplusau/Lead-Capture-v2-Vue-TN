import http from "@/utils/http";

const state = {
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
    invoiceTerms: [
        {value: 5, text: '1% 10 Net 30'},
        {value: 6, text: '2% 10 Net 30'},
        {value: 4, text: 'Due On Receipt'},
        {value: 7, text: 'Net 7 Days'},
        {value: 1, text: 'Net 15 Days'},
        {value: 2, text: 'Net 30 Days'},
        {value: 8, text: 'Net 45 Days'},
        {value: 3, text: 'Net 60 Days'},
        {value: 8, text: 'Net 90 Days'},
    ],
    yesNoOptions: [],
    mpExWeeklyUsageOptions: [],
    servicesOfInterestOptions: [],
    commencementTypeOptions: [],
    inOutOptions: [],
    usageFrequencyOptions: [],
    classifyLeadOptions: [],
    accountManagers: [
        {value: 668711, text: 'Lee Russell'},
        {value: 696160, text: 'Kerina Helliwell'},
        // {value: 690145, text: 'David Gdanski'},
        {value: 668712, text: 'Belinda Urbani'},
    ],
    carrierList: []
};

const getters = {
    industries : state => state.industries,
    leadSources : (state, getters, rootState, rootGetters) => {
        let rolesToRestrict = [
            1062, // Account Managers
            1063, // Lead Generation
            1064, // Lead Qualification
            1005, // Business Development Manager
        ];
        let leadSourcesToShow = [
            282051, // LPO - Head Office Generated
            282083, // LPO - AP Customer
            282085, // LPO - Inbound Web
            281559, // LPO - Transition
            285297, // Inbound - Head Office Generated
            99417, // Inbound - Web
            97943, // HO Generated
        ]

        return state.leadSources.filter(item => rolesToRestrict.includes(rootGetters['user/role']) ? leadSourcesToShow.includes(parseInt(item.value)) : true);
    },
    franchisees : state => state.franchisees.filter(item => item.text.toLowerCase().substring(0, 4) !== 'old '), // filter out franchisees with name starting with 'old'
    roles : state => state.roles,
    statuses : state => state.statuses,
    states : state => state.states,
    carrierList : state => state.carrierList,

    invoiceMethods : state => state.invoiceMethods,
    invoiceCycles : state => state.invoiceCycles,
    invoiceTerms : state => state.invoiceTerms,

    yesNoOptions : state => state.yesNoOptions,
    mpExWeeklyUsageOptions : state => state.mpExWeeklyUsageOptions,
    servicesOfInterestOptions : state => state.servicesOfInterestOptions,
    commencementTypeOptions : state => state.commencementTypeOptions,
    inOutOptions : state => state.inOutOptions,
    usageFrequencyOptions : state => state.usageFrequencyOptions,
    classifyLeadOptions : state => state.classifyLeadOptions,
    accountManagers : state => state.accountManagers,
};

const mutations = {};

const actions = {
    init : async context => {
        let alwaysLoad = ['getIndustries', 'getLeadSources', 'getFranchisees', 'getRoles', 'getCarrierList'];
        let conditionalLoad = [
            'getInvoiceMethods',
            'getInvoiceCycles',
            'getYesNoOptions',
            'getMPExWeeklyUsageOptions',
            'getServicesOfInterestOptions',
            'getCommencementTypeOptions',
            'getInOutOptions',
            'getUsageFrequencyOptions',
            'getClassifyLeadOptions'
        ];

        let dataToFetch = alwaysLoad.map(item => context.dispatch(item));
        if (context.rootGetters['customer/id'])
            dataToFetch.push(...conditionalLoad.map(item => context.dispatch(item)));

        await Promise.allSettled(dataToFetch);
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
    getInvoiceMethods : async context => {
        await _fetchDataForHtmlSelect(context, context.state.invoiceMethods,
            null, 'customlist_invoice_method', 'internalId', 'name');
    },
    getInvoiceCycles : async context => {
        await _fetchDataForHtmlSelect(context, context.state.invoiceCycles,
            null, 'customlist_invoicing_cyle', 'internalId', 'name');
    },
    getYesNoOptions : async context => {
        await _fetchDataForHtmlSelect(context, context.state.yesNoOptions,
            null, 'customlist107_2', 'internalId', 'name');
    },
    getMPExWeeklyUsageOptions : async context => {
        await _fetchDataForHtmlSelect(context, context.state.mpExWeeklyUsageOptions,
            null, 'customlist_form_mpex_usage_per_week', 'internalId', 'name');
    },
    getServicesOfInterestOptions : async context => {
        await _fetchDataForHtmlSelect(context, context.state.servicesOfInterestOptions,
            null, 'customlist1081', 'internalId', 'name');
    },
    getCommencementTypeOptions : async context => {
        await _fetchDataForHtmlSelect(context, context.state.commencementTypeOptions,
            null, 'customlist_sale_type', 'internalId', 'name');
    },
    getInOutOptions : async context => {
        await _fetchDataForHtmlSelect(context, context.state.inOutOptions,
            null, 'customlist_in_outbound', 'internalId', 'name');
    },
    getUsageFrequencyOptions : async context => {
        await _fetchDataForHtmlSelect(context, context.state.usageFrequencyOptions,
            null, 'customlist_usage_frequency', 'internalId', 'name');
    },
    getClassifyLeadOptions : async context => {
        await _fetchDataForHtmlSelect(context, context.state.classifyLeadOptions,
            null, 'customlist_classify_lead', 'internalId', 'name');
    },
    getCarrierList : async context => {
        await _fetchDataForHtmlSelect(context, context.state.carrierList,
            null, 'customlist_carrier', 'internalId', 'name');
    },
};

async function _fetchDataForHtmlSelect(context, stateObject, id, type, valueColumnName, textColumnName) {
    stateObject.splice(0);

    let data = await http.get('getSelectOptions', {
        id, type, valueColumnName, textColumnName
    });

    data.forEach(item => { stateObject.push(item); });
}

export default {
    state,
    getters,
    actions,
    mutations
};