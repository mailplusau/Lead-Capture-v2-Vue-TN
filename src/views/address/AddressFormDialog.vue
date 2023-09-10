<template>
    <v-dialog v-model="dialogOpen" width="50vw" :persistent="formBusy" eager>
        <template v-slot:activator="{ on, attrs }">
            <v-btn color="success" small :disabled="addressesLoading"
                   v-bind="attrs" v-on="on">
                add address
            </v-btn>
        </template>

        <v-card class="background">
            <v-container>
                <v-form ref="form" v-model="valid" lazy-validation :disabled="formBusy">
                    <v-row>
                        <v-col cols="12"><p class="text-h5 text-center">{{ title }}</p></v-col>
                        <v-col cols="12">
                            <v-text-field label="Company Name" v-model="form.addressee" dense
                                          :rules="[v => validate(v, 'required|minLength:3')]"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="5">
                            <v-autocomplete label="Address Type" dense
                                            v-model="addressTypes.selected" autocomplete="off"
                                            :items="addressTypes.options"
                                            @change="handleAddressTypeChanged"
                                            :rules="[v => validate(v, 'required')]"
                            ></v-autocomplete>
                        </v-col>

                        <v-col cols="7">
                            <v-text-field :label="addressType === 'street' ? 'Suite/Level/Unit' : 'Postal Box'"
                                          v-model="form.addr1" dense
                                          :rules="[v => validate(v, addressType === 'street' ? '' : 'required')]"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="12" v-show="addressType === 'street'">
                            <VuetifyGoogleAutocomplete label="Street No. & Name" dense clearable ref="googleAutocomplete"
                                                       @placeChanged="handlePlaceChanged"
                                                       :rules="[() => addressType === 'postal' || validateAutofillFields]" />
                        </v-col>

                        <v-col cols="3" v-if="addressType === 'postal'">
                            <v-autocomplete label="State" dense
                                            v-model="postalState" autocomplete="off"
                                            :items="$store.getters['misc/states']"
                                            :rules="[v => validate(v, 'required')]"
                                            @change="$store.dispatch('addresses/getPostalLocationsByStateId', postalState)"
                                            :disabled="$store.getters['addresses/postalLocations'].busy"
                                            :loading="$store.getters['addresses/postalLocations'].busy"
                            ></v-autocomplete>
                        </v-col>

                        <v-col cols="9" v-if="addressType === 'postal'">
                            <v-autocomplete label="Postal Location" dense item-value="internalid" item-text="name"
                                            v-model="form.custrecord_address_ncl" autocomplete="off"
                                            :items="$store.getters['addresses/postalLocations'].data"
                                            :rules="[v => validate(v, 'required')]"
                                            @change="$store.dispatch('addresses/handlePostalLocationChanged')"
                                            :disabled="$store.getters['addresses/postalLocations'].busy"
                                            :loading="$store.getters['addresses/postalLocations'].busy"
                            ></v-autocomplete>
                        </v-col>

                        <v-col cols="4">
                            <v-text-field label="City" v-model="form.city" dense disabled
                                          :rules="[v => validate(v, 'required')]"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="4" v-if="addressType === 'street'">
                            <v-text-field label="State" v-model="form.state" dense disabled
                                          :rules="[v => validate(v, 'required')]"
                            ></v-text-field>
                        </v-col>

                        <v-col :cols="addressType === 'street' ? 4 : 8">
                            <v-text-field :label="'Postcode' + (addressType === 'postal' ? '/Mailing code' : '')"
                                          v-model="form.zip" dense :disabled="addressType === 'street'"
                                          :rules="[v => validate(v, 'required')]"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="6">
                            <v-text-field label="Lat" v-model="form.custrecord_address_lat" dense disabled
                                          :rules="[v => validate(v, 'required')]"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="6">
                            <v-text-field label="Lng" v-model="form.custrecord_address_lon" dense disabled
                                          :rules="[v => validate(v, 'required')]"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="4">
                            <v-checkbox v-model="form.defaultshipping"
                                        label="Default Shipping"
                            ></v-checkbox>
                        </v-col>

                        <v-col cols="4">
                            <v-checkbox v-model="form.defaultbilling"
                                        label="Default Billing"
                            ></v-checkbox>
                        </v-col>

                        <v-col cols="4">
                            <v-checkbox v-model="form.isresidential"
                                        label="Postal Address"
                            ></v-checkbox>
                        </v-col>
                    </v-row>
                </v-form>
            </v-container>

            <v-card-actions class="pb-5">
                <v-spacer></v-spacer>
                <v-btn color="red darken-1" dark class="mx-3" @click="dialogOpen = false" :disabled="formBusy">
                    Cancel
                </v-btn>
                <v-btn color="green darken-1" dark class="mx-3" @click="save" :disabled="formBusy">
                    Save
                </v-btn>
                <v-spacer></v-spacer>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import {allowOnlyNumericalInput, rules} from '@/utils/utils.mjs';
import VuetifyGoogleAutocomplete from '@/components/VuetifyGoogleAutocomplete';

export default {
    name: "AddressFormDialog",
    components: {VuetifyGoogleAutocomplete},
    data: () => ({
        valid: true,
    }),
    methods: {
        validate: rules.validate,
        allowOnlyNumericalInput,
        handlePlaceChanged(googlePlace) {
            this.form.custrecord_address_lat = '';
            this.form.custrecord_address_lon = '';
            this.form.addr2 = '';
            this.form.zip = '';
            this.form.state = '';
            this.form.city = '';

            if (!googlePlace) return;

            this.form.custrecord_address_lat = googlePlace?.geometry?.location?.lat();
            this.form.custrecord_address_lon = googlePlace?.geometry?.location?.lng();

            let address2 = "";

            for (let addressComponent of googlePlace.address_components) {

                if (addressComponent.types[0] === 'street_number' || addressComponent.types[0] === 'route') {
                    address2 += addressComponent['short_name'] + " ";
                    this.form.addr2 = address2;
                }
                if (addressComponent.types[0] === 'postal_code') {
                    this.form.zip = addressComponent['short_name'];
                }
                if (addressComponent.types[0] === 'administrative_area_level_1') {
                    this.form.state = addressComponent['short_name'];
                }
                if (addressComponent.types[0] === 'locality') {
                    this.form.city = addressComponent['short_name'];
                }
            }

            this.$refs.form.validate();
        },
        handleAddressTypeChanged() {
            this.postalState = null;
            this.$store.dispatch('addresses/handleAddressTypeChanged');
            this.$refs.form.resetValidation();
        },
        save() {
            if (!this.$refs.form.validate()) return;
            this.$store.dispatch('addresses/saveAddress');
            this.dialogOpen = false;
        },
    },
    computed: {
        form() {
            return this.$store.getters['addresses/dialog'].form;
        },
        formBusy() {
            return this.$store.getters['addresses/dialog'].busy;
        },
        title() {
            return this.$store.getters['addresses/dialog'].title;
        },
        addressesLoading() {
            return this.$store.getters['addresses/all'].busy;
        },
        addressType() {
            return this.$store.getters['addresses/addressTypes'].selected;
        },
        addressTypes() {
            return this.$store.getters['addresses/addressTypes'];
        },
        dialogOpen: {
            get() {
                return this.$store.getters['addresses/dialog'].open;
            },
            set(val) {
                this.$store.dispatch('addresses/openDialog', {open: val});
            }
        },
        postalState: {
            get() {
                return this.$store.getters['addresses/postalState'];
            },
            set(val) {
                this.$store.commit('addresses/setPostalState', val);
            }
        },
        validateAutofillFields() {
            return !!this.form.custrecord_address_lat ||
                !!this.form.custrecord_address_lon ||
                !!this.form.addr2 ||
                !!this.form.zip ||
                !!this.form.state ||
                !!this.form.city || 'Please fill in this field using one of the address suggestions';
        },
    },
    watch: {
        dialogOpen(val) {
            if (val && this.addressType === 'street') {
                if (this.form.internalid >= 0)
                    this.$refs?.googleAutocomplete?.setInput(`${this.form.addr2.trim()}, ${this.form.city} ${this.form.state}`)
                else this.$refs?.googleAutocomplete?.clearInput();
            }
        }
    }
};
</script>

<style scoped>

</style>