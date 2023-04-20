<template>
    <b-tab title="MP Express & Standard">
        <b-row>
            <div class="col-12 mb-4">
                <h2>MPEX Usage</h2>
            </div>
            <div class="col-4 mb-4">
                <b-input-group prepend="Is MPEX Customer">
                    <b-form-select v-model="mpExInfo.form.custentity_mpex_customer" :options="$store.getters['customer/yesNoOptions']"
                                   :disabled="mpExInfo.formDisabled"></b-form-select>
                </b-input-group>
            </div>
            <div class="col-4 mb-4">
                <b-input-group prepend="MP Weekly Usage">
                    <b-form-select v-model="mpExInfo.form.custentity_form_mpex_usage_per_week" :options="mpExInfo.weeklyUsageOptions"
                                   :disabled="mpExInfo.formDisabled"></b-form-select>
                </b-input-group>
            </div>
            <div class="col-4 mb-4">
                <b-input-group prepend="MP Expected Usage">
                    <b-form-input v-model="mpExInfo.form.custentity_exp_mpex_weekly_usage"
                                  :disabled="mpExInfo.formDisabled"></b-form-input>
                </b-input-group>
            </div>
            <b-col cols="12" class="mb-4">
                <b-button @click="editForm" v-if="mpExInfo.formDisabled" size="sm" :disabled="busy" variant="outline-primary">Edit MPEX Usage</b-button>
                <template v-else>
                    <b-button @click="resetForm" size="sm" class="mx-2" :disabled="busy">Reset</b-button>
                    <b-button @click="cancelEditing" size="sm" class="mx-2" :disabled="busy" variant="outline-danger">Cancel</b-button>
                    <b-button @click="saveForm" size="sm" class="mx-2" :disabled="busy" variant="outline-success">Save</b-button>
                </template>
            </b-col>
        </b-row>

        <b-row>
            <div class="col-12">
                <h2>Pricing Structure</h2>

                <b-table :items="productPricing" :fields="productPricingColumns" head-row-variant="light" striped show-empty></b-table>
            </div>
            <b-col cols="12" class="mb-4">
                <b-button variant="primary" @click="goToProductPricing" :disabled="busy" size="sm">
                    Add/Edit Product Pricing <b-icon icon="box-arrow-up-right" scale=".6"></b-icon>
                </b-button>
            </b-col>
        </b-row>

        <b-row>
            <div class="col-12">
                <h2>MPEX - Weekly Usage</h2>

                <b-table :items="mpExInfo.weeklyUsageTable" :fields="weeklyUsageColumns" head-row-variant="light" striped show-empty
                         label-sort-asc="" label-sort-desc="" label-sort-clear=""></b-table>
            </div>
        </b-row>
    </b-tab>
</template>

<script>
export default {
    name: "MPEXAndStandardTab",
    data: () => ({
        productPricingColumns: [
            {key: 'custrecord_prod_pricing_delivery_speeds_text', label: 'Delivery Speeds'},
            {key: 'custrecord_prod_pricing_pricing_plan_text', label: 'Pricing Plan'},
            {key: 'custrecord_prod_pricing_b4_text', label: 'B4'},
            {key: 'custrecord_prod_pricing_250g_text', label: '250G'},
            {key: 'custrecord_prod_pricing_500g_text', label: '500G'},
            {key: 'custrecord_prod_pricing_1kg_text', label: '1KG'},
            {key: 'custrecord_prod_pricing_3kg_text', label: '3KG'},
            {key: 'custrecord_prod_pricing_5kg_text', label: '5KG'},
            {key: 'custrecord_prod_pricing_10kg_text', label: '10KG'},
            {key: 'custrecord_prod_pricing_20kg_text', label: '20KG'},
            {key: 'custrecord_prod_pricing_25kg_text', label: '25KG'},
        ],
        weeklyUsageColumns: [
            {key: 'col1', label: 'Week Used', sortable: true},
            {key: 'col2', label: 'Usage Count', sortable: true}
        ]
    }),
    methods: {
        goToProductPricing() {
            let url = nlapiResolveURL('SUITELET', 'customscript_sl2_prod_pricing_page', 'customdeploy1');
            url += '&customerid=' + parseInt(this.$store.getters['customer/internalId']);

            window.open(url, "_self",
                "height=750,width=650,modal=yes,alwaysRaised=yes");
        },
        editForm() {
            this.mpExInfo.formDisabled = false;
        },
        resetForm() {
            this.$store.commit('customer/resetMpExInfoForm');
        },
        cancelEditing() {
            this.mpExInfo.formDisabled = true;
            this.$store.commit('customer/resetMpExInfoForm');
        },
        saveForm() {
            this.mpExInfo.formDisabled = true;
            this.$store.dispatch('customer/saveMpExInfo')
        },
    },
    computed: {
        mpExInfo() {
            return this.$store.getters['customer/mpExInfo'];
        },
        busy() {
            return this.$store.getters['customer/busy'];
        },
        productPricing() {
            return this.$store.getters['product-pricing/get']
        }
    },
    watch: {
        'mpExInfo.form.custentity_mpex_customer': function (val) {
            if (parseInt(val) === 2) { // 2 means No
                this.mpExInfo.form.custentity_form_mpex_usage_per_week = '';
                this.mpExInfo.form.custentity_exp_mpex_weekly_usage = '';
            }
        }
    }
}
</script>

<style scoped>

</style>