import http from "@/utils/http";

const state = {
    role: null,
    id: null,

    salesRep: {
        id: -1,
        name: 'Test Account Manager',
    }
};

const getters = {
    role : state => state.role,
    id : state => state.id,
    salesRep : state => state.salesRep,

    isFranchisee : state => state.role === 1000,
    isDataAdmin : state => state.role === 1032,
};

const mutations = {};

const actions = {
    init : async context => {
        if (context.rootGetters['testMode']) return _hydrateTestData(context);

        let {role, id, salesRep} = await http.get('getCurrentUserDetails');

        context.state.role = parseInt(role);
        context.state.id = parseInt(id);
        context.state.salesRep.id = salesRep.id ? parseInt(salesRep.id) : null;
        context.state.salesRep.name = salesRep.name || null;
    },
};

function _hydrateTestData(context) {
    context.state.role = 3;
    context.state.id = 779884;
    context.state.salesRep.id = 1732844;
    context.state.salesRep.name = 'Tim Nguyen';
}

export default {
    state,
    getters,
    actions,
    mutations
};