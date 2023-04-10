<template>
    <b-tab title="Additional Information">
        <b-row>
            <div class="col-6 mb-4">
                <b-input-group prepend="Multisite">
                    <b-form-select v-model="surveyInfo.form.custentity_category_multisite" :options="trueFalseOptions"
                                   :disabled="surveyInfo.formDisabled"></b-form-select>
                </b-input-group>
            </div>
            <div class="col-6 mb-4">
                <b-input-group prepend="Multisite Link">
                    <b-form-input v-model="surveyInfo.form.custentity_category_multisite_link"
                                  :disabled="surveyInfo.formDisabled"></b-form-input>
                </b-input-group>
            </div>
            <div class="col-6 mb-4">
                <b-input-group prepend="Visited by Franchisee?">
                    <b-form-select v-model="surveyInfo.form.custentity_mp_toll_zeevisit" :options="trueFalseOptions"
                                   :disabled="surveyInfo.formDisabled"></b-form-select>
                </b-input-group>
            </div>
            <div class="col-6 mb-4">
                <b-input-group prepend="Franchisee Visit Note">
                    <b-form-input v-model="surveyInfo.form.custentity_mp_toll_zeevisit_memo"
                                  :disabled="surveyInfo.formDisabled"></b-form-input>
                </b-input-group>
            </div>
            <div class="col-6 mb-4">
                <b-input-group prepend="Using Mail / Parcels / Satchels Regularly?">
                    <b-form-select v-model="surveyInfo.form.custentity_ap_mail_parcel" :options="$store.getters['customer/yesNoOptions']"
                                   :disabled="surveyInfo.formDisabled"></b-form-select>
                </b-input-group>
            </div>

            <template v-if="isUsingRegularly">
                <div class="col-8 mb-4">
                    <b-input-group prepend="Frequency of Mail / Parcels / Satchels">
                        <b-form-select v-model="frequency" :options="surveyInfo.usageFrequencyOptions" v-validate="'required'" data-vv-name="frequency"
                                       :class="errors.has('frequency') ? 'is-invalid' : ''" :disabled="surveyInfo.formDisabled"></b-form-select>
                    </b-input-group>

                    <b-form-invalid-feedback :state="!errors.has('frequency')">{{ errors.first('frequency') }}</b-form-invalid-feedback>
                </div>
                <div class="col-6 mb-4">
                    <b-input-group prepend="Using Express Post?">
                        <b-form-select v-model="surveyInfo.form.custentity_customer_express_post" :options="$store.getters['customer/yesNoOptions']"
                                       v-validate="'required'" data-vv-name="using_express_post"
                                       :class="errors.has('using_express_post') ? 'is-invalid' : ''"
                                       :disabled="surveyInfo.formDisabled"></b-form-select>
                    </b-input-group>

                    <b-form-invalid-feedback :state="!errors.has('using_express_post')">{{ errors.first('using_express_post') }}</b-form-invalid-feedback>
                </div>
                <div class="col-6 mb-4">
                    <b-input-group prepend="Using Local Couriers?">
                        <b-form-select v-model="surveyInfo.form.custentity_customer_local_couriers" :options="$store.getters['customer/yesNoOptions']"
                                       v-validate="'required'" data-vv-name="using_local_couriers"
                                       :class="errors.has('using_local_couriers') ? 'is-invalid' : ''"
                                       :disabled="surveyInfo.formDisabled"></b-form-select>
                    </b-input-group>

                    <b-form-invalid-feedback :state="!errors.has('using_local_couriers')">{{ errors.first('using_local_couriers') }}</b-form-invalid-feedback>
                </div>
            </template>

            <div class="col-6 mb-4">
                <b-input-group prepend="Using P.O Box?">
                    <b-form-select v-model="surveyInfo.form.custentity_customer_po_box" :options="$store.getters['customer/yesNoOptions']"
                                   :disabled="surveyInfo.formDisabled"></b-form-select>
                </b-input-group>
            </div>
            <div class="col-6 mb-4">
                <b-input-group prepend="Bank Visit?">
                    <b-form-select v-model="surveyInfo.form.custentity_customer_bank_visit" :options="$store.getters['customer/yesNoOptions']"
                                   :disabled="surveyInfo.formDisabled"></b-form-select>
                </b-input-group>
            </div>
            <div class="col-6 mb-4">
                <b-input-group prepend="Classify Lead">
                    <b-form-select v-model="surveyInfo.form.custentity_lead_type" :options="surveyInfo.classifyLeadOptions"
                                   v-validate="'required'" data-vv-name="classify_lead"
                                   :class="errors.has('classify_lead') ? 'is-invalid' : ''"
                                   :disabled="surveyInfo.formDisabled"></b-form-select>

                    <b-form-invalid-feedback :state="!errors.has('classify_lead')">{{ errors.first('classify_lead') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>


            <b-col cols="12" class="mb-4">
                <b-button @click="editForm" v-if="surveyInfo.formDisabled" size="sm" :disabled="busy" variant="outline-primary">Edit Additional Information</b-button>
                <template v-else>
                    <b-button @click="resetForm" size="sm" class="mx-2" :disabled="busy">Reset</b-button>
                    <b-button @click="cancelEditing" size="sm" class="mx-2" :disabled="busy" variant="outline-danger">Cancel</b-button>
                    <b-button @click="saveForm" size="sm" class="mx-2" :disabled="busy" variant="outline-success">Save</b-button>
                </template>
            </b-col>
        </b-row>
    </b-tab>
</template>

<script>
export default {
    name: "AdditionalInformationTab",
    data: () => ({
        frequency: null,
        isUsingRegularly: false,
        trueFalseOptions: [
            {value: true, text: 'Yes'},
            {value: false, text: 'No'},
        ]
    }),
    methods: {

        editForm() {
            this.surveyInfo.formDisabled = false;
        },
        resetForm() {
            this.$store.commit('customer/resetSurveyInfoForm');
        },
        cancelEditing() {
            this.surveyInfo.formDisabled = true;
            this.$store.commit('customer/resetSurveyInfoForm');
        },
        saveForm() {
            this.$validator.validateAll().then((result) => {
                if (result) {
                    console.log('Form Submitted!');
                    this.surveyInfo.formDisabled = true;
                    this.$store.dispatch('customer/saveSurveyInfo');
                } else console.log('Correct them errors!');
            });
        },
    },
    computed: {
        surveyInfo() {
            return this.$store.getters['customer/surveyInfo']
        },
        busy() {
            return this.$store.getters['customer/busy'];
        },
    },
    watch: {
        'surveyInfo.form.custentity_ap_mail_parcel': function (val) {
            this.isUsingRegularly = (parseInt(val) === 1); // Check if this is Yes (1) or No (2)

            if (!this.isUsingRegularly) { // Set the dependent fields to No (2) if this is false
                this.surveyInfo.form.custentity_customer_express_post = 2;
                this.surveyInfo.form.custentity_customer_local_couriers = 2;
            }
        }
    }
}
</script>

<style scoped>

</style>