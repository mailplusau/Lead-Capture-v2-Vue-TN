import getNSModules from '../../utils/ns-modules';

const state = {
    data: [],
};

const getters = {
    get : state => state.data,
};

const mutations = {};

const actions = {
    init : context => {
        if (!context.rootGetters['customer/internalId']) return;

        context.dispatch('getItemPricing').then();
    },
    getItemPricing : async context => {
        let NS_MODULES = await getNSModules();

        let customerRecord = NS_MODULES.record.load({
            type: NS_MODULES.record.Type.CUSTOMER,
            id: context.rootGetters['customer/internalId'],
            isDynamic: true
        });

        let lineCount = customerRecord.getLineCount({sublistId: 'itempricing'});

        for (let line = 0; line < lineCount; line++) {
            context.state.data.push({
                text: customerRecord.getSublistText({
                    sublistId: 'itempricing',
                    fieldId: 'item',
                    line
                }),
                price: customerRecord.getSublistValue({
                    sublistId: 'itempricing',
                    fieldId: 'price',
                    line
                })
            })
        }
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};