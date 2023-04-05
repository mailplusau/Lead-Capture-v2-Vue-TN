import getNSModules from '../../utils/ns-modules';

const state = {
    productPricing: {
        values: {
            internalid: null,
            custrecord_prod_pricing_status: null,
            custrecord_prod_pricing_last_update: null,
            custrecord_prod_pricing_delivery_speeds: null,
            custrecord_prod_pricing_pricing_plan: null,
            custrecord_prod_pricing_def_prod_type: null,
            custrecord_prod_pricing_b4: null,
            custrecord_prod_pricing_250g: null,
            custrecord_prod_pricing_500g: null,
            custrecord_prod_pricing_1kg: null,
            custrecord_prod_pricing_3kg: null,
            custrecord_prod_pricing_5kg: null,
            custrecord_prod_pricing_10kg: null,
            custrecord_prod_pricing_20kg: null,
            custrecord_prod_pricing_25kg: null,
            custrecord_sycn_complete: null,

        },
        texts: {
            custrecord_prod_pricing_delivery_speeds: '',
            custrecord_prod_pricing_pricing_plan: '',
            custrecord_prod_pricing_def_prod_type: '',
            custrecord_prod_pricing_b4: '',
            custrecord_prod_pricing_250g: '',
            custrecord_prod_pricing_500g: '',
            custrecord_prod_pricing_1kg: '',
            custrecord_prod_pricing_3kg: '',
            custrecord_prod_pricing_5kg: '',
            custrecord_prod_pricing_10kg: '',
            custrecord_prod_pricing_20kg: '',
            custrecord_prod_pricing_25kg: '',
            custrecord_sycn_complete: '',
        }
    },
    data: [],
};

const getters = {
    get : state => state.data,
};

const mutations = {};

const actions = {
    init : context => {
        if (!context.rootGetters['customer/internalId']) return;

        context.dispatch('getProductPricing').then();
    },
    getProductPricing : async context => {
        let {search} = await getNSModules();

        let searchProductPricing = search.load({
            id: 'customsearch_prod_pricing_customer_level',
            type: 'customrecord_product_pricing'
        });

        searchProductPricing.filters.push(search.createFilter({
            name: 'custrecord_prod_pricing_customer',
            join: null,
            operator: 'anyof',
            values: context.rootGetters['customer/internalId'],
        }));

        searchProductPricing.run().each(item => {
            let tmp = {};

            for (let fieldId in context.state.productPricing.values)
                tmp[fieldId] = item.getValue({name: fieldId});

            for (let fieldId in context.state.productPricing.texts)
                tmp[fieldId + '_text'] = item.getText({name: fieldId});

            context.state.data.push(tmp);

            return true;
        })
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};