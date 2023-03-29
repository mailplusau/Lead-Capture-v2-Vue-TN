<template>
    <b-card v-if="$store.getters['customer/showAdditionalInfoSection']" border-variant="primary" bg-variant="transparent" class="mt-3">
        <div class="row justify-content-center align-items-stretch">
            <div class="col-12">
                <h1 class="text-center mp-header">Additional Information</h1>
            </div>
            <div class="col-lg-6 col-12 mb-4">
                <b-input-group prepend="MAAP Bank Account #">
                    <b-form-input :value="details.custentity_maap_bankacctno" disabled></b-form-input>
                </b-input-group>
            </div>
            <div class="col-lg-6 col-12 mb-4">
                <b-input-group prepend="MAAP Parent Bank Account #">
                    <b-form-input :value="details.custentity_maap_bankacctno_parent" disabled></b-form-input>
                </b-input-group>
            </div>
            <div class="col-12 mb-4">
                <b-input-group prepend="Franchisee Name">
                    <b-form-input :value="franchisee.companyname" disabled></b-form-input>
                </b-input-group>
            </div>
            <div class="col-6 mb-4">
                <b-input-group prepend="Main Contact">
                    <b-form-input :value="franchisee.custentity3" disabled></b-form-input>
                </b-input-group>
            </div>
            <div class="col-6 mb-4">
                <b-input-group prepend="Franchisee ABN">
                    <b-form-input :value="franchisee.custentity_abn_franchiserecord" disabled></b-form-input>
                </b-input-group>
            </div>
            <div class="col-6 mb-4">
                <b-input-group prepend="Franchisee Email">
                    <b-form-input :value="franchisee.email" disabled></b-form-input>
                </b-input-group>
            </div>
            <div class="col-6 mb-4">
                <b-input-group prepend="Franchisee Phone">
                    <b-form-input :value="franchisee.custentity2" disabled></b-form-input>
                </b-input-group>
            </div>
            <div class="col-6 mb-4">
                <b-input-group prepend="Invoice Method">
                    <b-form-select v-model="additionalInfo.custentity_invoice_method" v-validate="'required'" data-vv-name="invoice_method"
                                   :options="$store.getters['invoiceMethods']" :disabled="formDisabled"></b-form-select>

                    <b-form-invalid-feedback :state="!errors.has('invoice_method')">{{ errors.first('invoice_method') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-6 mb-4">
                <b-input-group prepend="Account CC Email">
                    <b-form-input v-model="additionalInfo.custentity_accounts_cc_email" v-validate="'required|email'" data-vv-name="accounts_cc_email"
                                  :class="errors.has('accounts_cc_email') ? 'is-invalid' : ''" :disabled="formDisabled"></b-form-input>

                    <b-form-invalid-feedback :state="!errors.has('accounts_cc_email')">{{ errors.first('accounts_cc_email') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-6 mb-4">
                <b-input-group prepend="MPEX PO #">
                    <b-form-input v-model="additionalInfo.custentity_mpex_po" v-validate="''" data-vv-name="mpex_po"
                                  :class="errors.has('mpex_po') ? 'is-invalid' : ''" :disabled="formDisabled"></b-form-input>

                    <b-form-invalid-feedback :state="!errors.has('mpex_po')">{{ errors.first('mpex_po') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-6 mb-4">
                <b-input-group prepend="Customer's PO #">
                    <b-form-input v-model="additionalInfo.custentity11" v-validate="''" data-vv-name="customer_po"
                                  :class="errors.has('customer_po') ? 'is-invalid' : ''" :disabled="formDisabled"></b-form-input>

                    <b-form-invalid-feedback :state="!errors.has('customer_po')">{{ errors.first('customer_po') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-lg-4 col-6 mb-4">
                <b-input-group prepend="Terms">
                    <b-form-select v-model="additionalInfo.terms" v-validate="''" data-vv-name="terms"
                                   :options="$store.getters['terms']" :disabled="formDisabled"></b-form-select>

                    <b-form-invalid-feedback :state="!errors.has('terms')">{{ errors.first('terms') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-lg-4 col-6 mb-4">
                <b-input-group prepend="Customer's Terms">
                    <b-form-input v-model="additionalInfo.custentity_finance_terms" v-validate="''" data-vv-name="customer_terms"
                                  :class="errors.has('customer_terms') ? 'is-invalid' : ''" :disabled="formDisabled"></b-form-input>

                    <b-form-invalid-feedback :state="!errors.has('customer_terms')">{{ errors.first('customer_terms') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-lg-4 col-12 mb-4">
                <b-input-group prepend="MPEX Invoice Cycle">
                    <b-form-select v-model="additionalInfo.custentity_mpex_invoicing_cycle" v-validate="'required'" data-vv-name="mpex_invoicing_cycle"
                                   :options="$store.getters['invoiceCycles']" :disabled="formDisabled"></b-form-select>

                    <b-form-invalid-feedback :state="!errors.has('mpex_invoicing_cycle')">{{ errors.first('mpex_invoicing_cycle') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-12">
                <b-button @click="editForm" v-if="formDisabled" size="sm" :disabled="busy" variant="outline-primary">Edit Additional Information</b-button>
                <template v-else>
                    <b-button @click="resetForm" size="sm" class="mx-2" :disabled="busy">Reset</b-button>
                    <b-button @click="cancelEditing" size="sm" class="mx-2" :disabled="busy" variant="outline-danger">Cancel</b-button>
                    <b-button @click="saveForm" size="sm" class="mx-2" :disabled="busy" variant="outline-success">Save</b-button>
                </template>
            </div>
            <div class="col-12">
                User role: {{$store.getters['userRole']}}
            </div>
        </div>
    </b-card>
</template>

<script>
export default {
    name: "AdditionalInformation",
    methods: {
        editForm() {
            this.$store.commit('customer/disableAdditionalInfoForm', false);
        },
        resetForm() {
            this.$store.commit('customer/resetAdditionalInfoForm');
        },
        cancelEditing() {
            this.$store.commit('customer/disableAdditionalInfoForm');
            this.$store.commit('customer/resetAdditionalInfoForm');

        },
        saveForm() {
            this.$validator.validateAll().then((result) => {
                if (result) {
                    console.log('Form Submitted!');
                    this.$store.dispatch('customer/saveAdditionalInfo');
                } else console.log('Correct them errors!');
            });
        }
    },
    computed: {
        details() {
            return this.$store.getters['customer/details'];
        },
        franchisee() {
            return this.$store.getters['customer/franchisee'];
        },
        additionalInfo() {
            return this.$store.getters['customer/additionalInfoForm'];
        },
        formDisabled() {
            return this.$store.getters['customer/additionalInfoFormDisabled'];
        },
        busy() {
            return this.$store.getters['customer/busy'];
        },
    }
}
</script>

<style scoped>

</style>