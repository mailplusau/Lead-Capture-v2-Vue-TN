<template>
    <v-card flat color="background">
        <v-container class="pa-6">
            <v-form ref="form" v-model="valid" lazy-validation :disabled="false">
                <v-row justify="start">

                    <v-col cols="6">
                        <v-autocomplete dense label="Multisite"
                                        v-model="form.custentity_category_multisite"
                                        :items="trueFalseOptions"
                                        :disabled="formDisabled"
                        ></v-autocomplete>
                    </v-col>

                    <v-col cols="6">
                        <v-text-field dense label="Multisite Link"
                                      v-model="form.custentity_category_multisite_link"
                                      :disabled="formDisabled"
                        ></v-text-field>
                    </v-col>

                    <v-col cols="6">
                        <v-autocomplete dense label="Visited by Franchisee?"
                                        v-model="form.custentity_mp_toll_zeevisit"
                                        :items="trueFalseOptions"
                                        :disabled="formDisabled"
                        ></v-autocomplete>
                    </v-col>

                    <v-col cols="6">
                        <v-text-field dense label="Franchisee Visit Note"
                                      v-model="form.custentity_mp_toll_zeevisit_memo"
                                      :disabled="formDisabled"
                        ></v-text-field>
                    </v-col>

                    <v-col cols="6">
                        <v-autocomplete dense label="Using Mail / Parcels / Satchels Regularly?"
                                        v-model="form.custentity_ap_mail_parcel"
                                        :items="$store.getters['misc/yesNoOptions']"
                                        :disabled="formDisabled"
                                        @change="handleFrequencyChanged"
                        ></v-autocomplete>
                    </v-col>

                    <template v-if="isUsingRegularly">
                        <v-col cols="6">
                            <v-autocomplete dense label="Frequency of Mail / Parcels / Satchels"
                                            v-model="frequency"
                                            :items="$store.getters['misc/usageFrequencyOptions']"
                                            :rules="[v => validate(v, 'required')]"
                                            :disabled="formDisabled"
                            ></v-autocomplete>
                        </v-col>

                        <v-col cols="6">
                            <v-autocomplete dense label="Using Express Post?"
                                            v-model="form.custentity_customer_express_post"
                                            :items="$store.getters['misc/yesNoOptions']"
                                            :disabled="formDisabled"
                            ></v-autocomplete>
                        </v-col>

                        <v-col cols="6">
                            <v-autocomplete dense label="Using Local Couriers?"
                                            v-model="form.custentity_customer_local_couriers"
                                            :items="$store.getters['misc/yesNoOptions']"
                                            :rules="[v => validate(v, 'required')]"
                                            :disabled="formDisabled"
                            ></v-autocomplete>
                        </v-col>
                    </template>

                    <v-col cols="6">
                        <v-autocomplete dense label="Using P.O Box?"
                                        v-model="form.custentity_customer_po_box"
                                        :items="$store.getters['misc/yesNoOptions']"
                                        :disabled="formDisabled"
                        ></v-autocomplete>
                    </v-col>

                    <v-col cols="6">
                        <v-autocomplete dense label="Bank Visit?"
                                        v-model="form.custentity_customer_bank_visit"
                                        :items="$store.getters['misc/yesNoOptions']"
                                        :disabled="formDisabled"
                        ></v-autocomplete>
                    </v-col>

                    <v-col cols="6">
                        <v-autocomplete dense label="Classify Lead"
                                        v-model="form.custentity_lead_type"
                                        :items="$store.getters['misc/classifyLeadOptions']"
                                        :rules="[v => validate(v, 'required')]"
                                        :disabled="formDisabled"
                        ></v-autocomplete>
                    </v-col>

                    <v-col cols="12" class="text-center mb-5">
                        <v-btn v-if="formDisabled" @click="editForm">Edit Survey Information</v-btn>
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
    name: "Survey",
    data: () => ({
        valid: true,
        frequency: null,
        isUsingRegularly: false,
        trueFalseOptions: [
            {value: true, text: 'Yes'},
            {value: false, text: 'No'},
        ]
    }),
    methods: {
        validate: rules.validate,
        allowOnlyNumericalInput,
        resetValidation() {
            this.$refs.form.resetValidation()
        },
        editForm() {
            this.$store.commit('extra-info/disableSurveyInfo', false);
        },
        resetForm() {
            this.$store.commit('extra-info/resetSurveyInfo');
            this.isUsingRegularly = (parseInt(this.form.custentity_ap_mail_parcel) === 1);
            this.$refs.form.resetValidation();
        },
        cancelEditing() {
            this.$store.commit('extra-info/resetSurveyInfo');
            this.isUsingRegularly = (parseInt(this.form.custentity_ap_mail_parcel) === 1);
            this.$store.commit('extra-info/disableSurveyInfo');
            this.$refs.form.resetValidation();
        },
        saveForm() {
            let res = this.$refs.form.validate();
            console.log('Form validation result', res);
            if (!res) return;
            console.log('Form validated, let\'s go');
            this.$store.dispatch('extra-info/saveSurveyInfo');
        },

        handleFrequencyChanged() {
            this.isUsingRegularly = (parseInt(this.form.custentity_ap_mail_parcel) === 1); // Check if this is Yes (1) or No (2)

            if (!this.isUsingRegularly) { // Set the dependent fields to No (2) if this is false
                this.form.custentity_customer_express_post = 2;
                this.form.custentity_customer_local_couriers = 2;
            }
        }
    },
    computed: {
        form() {
            return this.$store.getters['extra-info/surveyInfo'].form;
        },
        formDisabled() {
            return this.$store.getters['extra-info/surveyInfo'].formDisabled;
        },
    }
};
</script>

<style scoped>

</style>