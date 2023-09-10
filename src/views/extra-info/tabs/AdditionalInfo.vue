<template>
    <v-card flat color="background">
        <v-container class="pa-6">
            <v-form ref="form" v-model="valid" lazy-validation :disabled="false">
                <v-row justify="center">
                    <v-col cols="6">
                        <v-text-field dense label="MAAP Bank Account #" v-model="form.custentity_maap_bankacctno"
                                      disabled
                        ></v-text-field>
                    </v-col>

                    <v-col cols="6">
                        <v-text-field dense label="MAAP Parent Bank Account #" v-model="form.custentity_maap_bankacctno_parent"
                                      disabled
                        ></v-text-field>
                    </v-col>

                    <v-col cols="6">
                        <v-text-field dense label="Franchisee Name" v-model="franchisee.companyname"
                                      disabled
                        ></v-text-field>
                    </v-col>

                    <v-col cols="6">
                        <v-text-field dense label="Main Contact" v-model="franchisee.custentity3"
                                      disabled
                        ></v-text-field>
                    </v-col>

                    <v-col cols="6">
                        <v-text-field dense label="Franchisee ABN" v-model="franchisee.custentity_abn_franchiserecord"
                                      disabled
                        ></v-text-field>
                    </v-col>

                    <v-col cols="6">
                        <v-text-field dense label="Franchisee Email" v-model="franchisee.email"
                                      disabled
                        ></v-text-field>
                    </v-col>

                    <v-col cols="6">
                        <v-text-field dense label="Franchisee Phone" v-model="franchisee.custentity2"
                                      disabled
                        ></v-text-field>
                    </v-col>

                    <v-col cols="6">
                        <v-autocomplete dense label="Portal Credit Card Payment"
                                        v-model="form.custentity_portal_cc_payment"
                                        :items="$store.getters['misc/yesNoOptions']"
                                        :disabled="formDisabled"
                        ></v-autocomplete>
                    </v-col>

                    <v-col cols="6">
                        <v-autocomplete dense label="Invoice Method"
                                        v-model="form.custentity_invoice_method"
                                        :items="$store.getters['misc/invoiceMethods']"
                                        :disabled="formDisabled"
                        ></v-autocomplete>
                    </v-col>

                    <v-col cols="6">
                        <v-text-field dense label="Account CC Email" v-model="form.custentity_accounts_cc_email"
                                      :rules="[v => validate(v, 'email')]"
                                      :disabled="formDisabled"
                        ></v-text-field>
                    </v-col>

                    <v-col cols="6">
                        <v-text-field dense label="MPEX PO #" v-model="form.custentity_mpex_po"
                                      :disabled="formDisabled"
                        ></v-text-field>
                    </v-col>

                    <v-col cols="6">
                        <v-text-field dense label="Customer's PO #" v-model="form.custentity11"
                                      :disabled="formDisabled"
                        ></v-text-field>
                    </v-col>

                    <v-col cols="4">
                        <v-autocomplete dense label="Terms"
                                        v-model="form.terms"
                                        :items="$store.getters['misc/invoiceTerms']"
                                        :disabled="formDisabled"
                        ></v-autocomplete>
                    </v-col>

                    <v-col cols="4">
                        <v-text-field dense label="Customer's Terms" v-model="form.custentity_finance_terms"
                                      :disabled="formDisabled"
                        ></v-text-field>
                    </v-col>

                    <v-col cols="4">
                        <v-autocomplete dense label="Invoice Cycle"
                                        v-model="form.custentity_mpex_invoicing_cycle"
                                        :items="$store.getters['misc/invoiceCycles']"
                                        :disabled="formDisabled"
                        ></v-autocomplete>
                    </v-col>

                    <v-col cols="12" class="text-center">
                        <v-btn v-if="formDisabled" @click="editForm">Edit Customer's Details</v-btn>
                        <template v-else>
                            <v-btn class="mx-2" @click="cancelEditing">Cancel</v-btn>
                            <v-btn class="mx-2" @click="resetForm">Reset</v-btn>
                            <v-btn class="mx-2" @click="saveForm" :disabled="!valid">Save</v-btn>
                        </template>
                    </v-col>

                </v-row>
            </v-form>
        </v-container>
    </v-card>
</template>

<script>
import {allowOnlyNumericalInput, rules} from '@/utils/utils.mjs';

export default {
    name: "AdditionalInfo",
    data: () => ({
        valid: true,
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
            this.$store.commit('extra-info/disableAdditionalInfo', false);
        },
        resetForm() {
            this.$store.commit('extra-info/resetAdditionalInfo');
            this.$refs.form.resetValidation();
        },
        cancelEditing() {
            this.$store.commit('extra-info/resetAdditionalInfo');
            this.$store.commit('extra-info/disableAdditionalInfo');
            this.$refs.form.resetValidation();
        },
        saveForm() {
            let res = this.$refs.form.validate();
            console.log('Form validation result', res);
            if (!res) return;
            console.log('Form validated, let\'s go');
            this.$store.dispatch('extra-info/saveAdditionalInfo');
        },
    },
    computed: {
        form() {
            return this.$store.getters['extra-info/additionalInfo'].form;
        },
        franchisee() {
            return this.$store.getters['extra-info/additionalInfo'].franchisee;
        },
        formDisabled() {
            return this.$store.getters['extra-info/additionalInfo'].formDisabled;
        },

    }
};
</script>

<style scoped>

</style>