<template>
    <v-card flat color="background">
        <v-container class="pa-6">
            <v-form ref="form" v-model="valid" lazy-validation :disabled="false">
                <v-row justify="center">
                    <v-col cols="4">
                        <v-autocomplete dense label="Is MPEX Customer"
                                        v-model="form.custentity_mpex_customer"
                                        :items="$store.getters['misc/yesNoOptions']"
                                        :disabled="formDisabled"
                        ></v-autocomplete>
                    </v-col>

                    <v-col cols="4">
                        <v-autocomplete dense label="MP Weekly Usage"
                                        v-model="form.custentity_form_mpex_usage_per_week"
                                        :items="$store.getters['misc/mpExWeeklyUsageOptions']"
                                        :disabled="formDisabled"
                        ></v-autocomplete>
                    </v-col>

                    <v-col cols="4">
                        <v-text-field dense label="MP Expected Usage" v-model="form.custentity_exp_mpex_weekly_usage"
                                      :disabled="formDisabled"
                        ></v-text-field>
                    </v-col>

                    <v-col cols="12" class="text-center mb-5">
                        <v-btn v-if="formDisabled" @click="editForm">Edit Customer's Details</v-btn>
                        <template v-else>
                            <v-btn class="mx-2" @click="cancelEditing">Cancel</v-btn>
                            <v-btn class="mx-2" @click="resetForm">Reset</v-btn>
                            <v-btn class="mx-2" @click="saveForm" :disabled="!valid">Save</v-btn>
                        </template>
                    </v-col>

                    <v-data-table :headers="productPricingColumns" :items="productPricing" :loading="false"
                                  no-data-text="No Product Pricing to Show" :items-per-page="-1"
                                  class="elevation-2 background my-3 col-12" hide-default-footer
                                  loading-text="Loading pricing structures...">
                        <template v-slot:top>
                            <v-toolbar flat dense color="background darken-3" dark>
                                <v-toolbar-title class="subtitle-1">Pricing Structures</v-toolbar-title>
                            </v-toolbar>
                        </template>
                    </v-data-table>

                    <v-data-table :headers="weeklyUsageColumns" :items="weeklyUsage" :loading="false"
                                  no-data-text="No Weekly Usage Yet" :items-per-page="5"
                                  class="elevation-2 background my-3 col-12" loading-text="Loading weekly usage...">
                        <template v-slot:top>
                            <v-toolbar flat dense color="background darken-3" dark>
                                <v-toolbar-title class="subtitle-1">MPEX - Weekly Usage</v-toolbar-title>
                            </v-toolbar>
                        </template>
                    </v-data-table>
                </v-row>
            </v-form>
        </v-container>
    </v-card>
</template>

<script>
import {allowOnlyNumericalInput, rules} from '@/utils/utils.mjs';

export default {
    name: "MPProducts",
    data: () => ({
        valid: true,
        productPricingColumns: [
            {value: 'custrecord_prod_pricing_delivery_speeds_text', text: 'Delivery Speeds', align: 'center', cellClass: 'cell-text-size', sortable: false},
            {value: 'custrecord_prod_pricing_pricing_plan_text', text: 'Pricing Plan', align: 'center', cellClass: 'cell-text-size', sortable: false},
            {value: 'custrecord_prod_pricing_b4_text', text: 'B4', align: 'center', cellClass: 'cell-text-size', sortable: false},
            {value: 'custrecord_prod_pricing_250g_text', text: '250G', align: 'center', cellClass: 'cell-text-size', sortable: false},
            {value: 'custrecord_prod_pricing_500g_text', text: '500G', align: 'center', cellClass: 'cell-text-size', sortable: false},
            {value: 'custrecord_prod_pricing_1kg_text', text: '1KG', align: 'center', cellClass: 'cell-text-size', sortable: false},
            {value: 'custrecord_prod_pricing_3kg_text', text: '3KG', align: 'center', cellClass: 'cell-text-size', sortable: false},
            {value: 'custrecord_prod_pricing_5kg_text', text: '5KG', align: 'center', cellClass: 'cell-text-size', sortable: false},
            {value: 'custrecord_prod_pricing_10kg_text', text: '10KG', align: 'center', cellClass: 'cell-text-size', sortable: false},
            {value: 'custrecord_prod_pricing_20kg_text', text: '20KG', align: 'center', cellClass: 'cell-text-size', sortable: false},
            {value: 'custrecord_prod_pricing_25kg_text', text: '25KG', align: 'center', cellClass: 'cell-text-size', sortable: false},
        ],
        weeklyUsageColumns: [
            {value: 'col1', text: 'Week Used', sortable: true, align: 'center'},
            {value: 'col2', text: 'Usage Count', sortable: true, align: 'center'}
        ],
    }),
    mounted() {
        this.$refs.form.resetValidation();
    },
    methods: {
        validate: rules.validate,
        allowOnlyNumericalInput,
        resetValidation() {
            this.$refs.form.resetValidation()
        },
        editForm() {
            this.$store.commit('extra-info/disableMpExInfo', false);
        },
        resetForm() {
            this.$store.commit('extra-info/resetMpExInfo');
            this.$refs.form.resetValidation();
        },
        cancelEditing() {
            this.$store.commit('extra-info/resetMpExInfo');
            this.$store.commit('extra-info/disableMpExInfo');
            this.$refs.form.resetValidation();
        },
        saveForm() {
            let res = this.$refs.form.validate();
            console.log('Form validation result', res);
            if (!res) return;
            console.log('Form validated, let\'s go');
            this.$store.dispatch('extra-info/saveMpExInfo');
        },
    },
    computed: {
        form() {
            return this.$store.getters['extra-info/mpExInfo'].form;
        },
        formDisabled() {
            return this.$store.getters['extra-info/mpExInfo'].formDisabled;
        },
        productPricing() {
            return this.$store.getters['extra-info/mpExInfo'].pricingStructures;
        },
        weeklyUsage() {
            return this.$store.getters['extra-info/mpExInfo'].weeklyUsageTable;
        }
    }
};
</script>

<style>
.cell-text-size {
    font-size: 11px !important;
}
</style>