<template>
    <v-card flat color="background">
        <v-container class="pa-6">
            <v-form ref="form" v-model="valid" lazy-validation :disabled="false">
                <v-row justify="center">
                    <v-col cols="12">
                        <v-textarea label="Pricing Notes" v-model="form.custentity_customer_pricing_notes"
                                    :disabled="formDisabled"
                                    dense outlined hide-details></v-textarea>
                    </v-col>

                    <v-col cols="12" class="text-center mb-5">
                        <v-btn v-if="formDisabled" @click="editForm">Edit Pricing Note</v-btn>
                        <template v-else>
                            <v-btn class="mx-2" @click="cancelEditing">Cancel</v-btn>
                            <v-btn class="mx-2" @click="resetForm">Reset</v-btn>
                            <v-btn class="mx-2" @click="saveForm" :disabled="!valid">Save</v-btn>
                        </template>
                    </v-col>

                    <v-col cols="6">
                        <v-data-table :headers="serviceColumns" :items="services" :loading="servicesBusy"
                                      no-data-text="No Service to Show" :items-per-page="-1"
                                      class="elevation-5 background" hide-default-footer loading-text="Loading services...">

                            <template v-slot:top>
                                <v-toolbar flat dense color="background darken-3" dark>
                                    <v-toolbar-title class="subtitle-1">Services</v-toolbar-title>
                                </v-toolbar>
                            </template>

                            <template v-slot:item.price="{ item }">
                                {{ formatCurrency(item.custrecord_service_price) }}
                            </template>
                        </v-data-table>
                    </v-col>

                    <v-col cols="6">
                        <v-data-table :headers="itemPricingColumns" :items="itemPricing" :loading="itemPricingBusy"
                                      no-data-text="No Item Pricing to Show" :items-per-page="-1"
                                      class="elevation-5 background" hide-default-footer loading-text="Loading item pricing...">

                            <template v-slot:top>
                                <v-toolbar flat dense color="background darken-3" dark>
                                    <v-toolbar-title class="subtitle-1">Item pricing</v-toolbar-title>
                                </v-toolbar>
                            </template>

                            <template v-slot:item.price="{ item }">
                                {{ formatCurrency(item.price) }}
                            </template>
                        </v-data-table>
                    </v-col>

                    <v-col cols="12">
                        <v-btn color="primary" outlined @click="goToServiceAndPricingPage">
                            Update Service & Financial Tab <v-icon class="ml-2" small>mdi-open-in-new</v-icon>
                        </v-btn>
                    </v-col>
                </v-row>
            </v-form>
        </v-container>
    </v-card>
</template>

<script>
import {allowOnlyNumericalInput, rules, baseURL} from '@/utils/utils.mjs';

let AUDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'AUD',
});

export default {
    name: "ServicePricingNote",
    data: () => ({
        valid: true,
        formDisabled: true,
        serviceColumns: [
            {value: 'custrecord_service_text', text: 'Name', sortable: false, align: 'center'},
            {value: 'custrecord_service_description', text: 'Description', sortable: false, align: 'center'},
            {value: 'price', text: 'Price', sortable: false, align: 'center'},
        ],
        itemPricingColumns: [
            {value: 'name', text: 'Item Name', sortable: false, align: 'center'},
            {value: 'price', text: 'Item Price', sortable: false, align: 'center'},
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
            this.formDisabled = false;
        },
        resetForm() {
            this.$store.commit('extra-info/resetAdditionalInfo');
            this.$refs.form.resetValidation();
        },
        cancelEditing() {
            this.$store.commit('extra-info/resetAdditionalInfo');
            this.formDisabled = true;
            this.$refs.form.resetValidation();
        },
        saveForm() {
            let res = this.$refs.form.validate();
            console.log('Form validation result', res);
            if (!res) return;
            console.log('Form validated, let\'s go');
            this.formDisabled = true;
            this.$store.dispatch('extra-info/saveAdditionalInfo');
        },
        formatCurrency(value) {
            return AUDollar.format(value);
        },
        goToServiceAndPricingPage() {
            let params = {
                custid: this.$store.getters['customer/id'],
                servicechange: 1
            }
            params = JSON.stringify(params);

            let upload_url = baseURL + top.nlapiResolveURL('SUITELET', 'customscript_sl_smc_main', 'customdeploy_sl_smc_main') + '&unlayered=T&custparam_params=' + params;
            top.open(upload_url, "_blank");
        },
    },
    computed: {
        form() {
            return this.$store.getters['extra-info/additionalInfo'].form;
        },
        services() {
            return this.$store.getters['extra-info/servicePricing'].services;
        },
        servicesBusy() {
            return this.$store.getters['extra-info/servicePricing'].servicesBusy;
        },
        itemPricing() {
            return this.$store.getters['extra-info/servicePricing'].itemPricing;
        },
        itemPricingBusy() {
            return this.$store.getters['extra-info/servicePricing'].itemPricingBusy;
        },
    }
};
</script>

<style scoped>

</style>