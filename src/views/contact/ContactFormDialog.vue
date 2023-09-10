<template>
    <v-dialog v-model="dialogOpen" width="50vw" :persistent="formBusy" eager>
        <template v-slot:activator="{ on, attrs }">
            <v-btn color="success" small :disabled="contactsLoading"
                   v-bind="attrs" v-on="on">
                add contact
            </v-btn>
        </template>

        <v-card class="background">
            <v-container>
                <v-form ref="form" v-model="valid" lazy-validation :disabled="formBusy">
                    <v-row>
                        <v-col cols="12"><p class="text-h5 text-center">{{ title }}</p></v-col>

                        <v-col cols="6">
                            <v-text-field label="Firstname" v-model="form.firstname"
                                          :rules="[v => validate(v, 'required')]"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="6">
                            <v-text-field label="Lastname" v-model="form.lastname"
                                          :rules="[v => validate(v, 'required')]"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="6">
                            <v-text-field label="Email" v-model="form.email"
                                          :rules="[v => validate(v, franchiseeMode ? 'email' : 'required|email')]"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="6">
                            <v-text-field label="Phone" v-model="form.phone"
                                          :rules="[v => validate(v, 'required|ausPhone')]"
                            ></v-text-field>
                        </v-col>

                        <v-col cols="6">
                            <v-text-field label="Title/Position" v-model="form.title"
                                          placeholder="(optional)" persistent-placeholder
                            ></v-text-field>
                        </v-col>

                        <v-col cols="6">
                            <v-autocomplete label="Role"
                                            v-model="form.contactrole"
                                            :items="$store.getters['misc/roles']"
                                            :rules="[v => validate(v, 'required')]"
                                            @change="$store.dispatch('contacts/handleContactRoleChanged')"
                            ></v-autocomplete>
                        </v-col>

                        <v-col cols="6">
                            <v-checkbox v-model="portalAdmin"
                                        label="Portal Admin"
                            ></v-checkbox>
                        </v-col>

                        <v-col cols="6">
                            <v-checkbox v-model="portalUser"
                                        label="Portal User"
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

export default {
    name: "ContactFormDialog",
    data: () => ({
        valid: true,
    }),
    methods: {
        validate: rules.validate,
        allowOnlyNumericalInput,
        save() {
            if (!this.$refs.form.validate()) return;
            this.$store.dispatch('contacts/save')
            this.dialogOpen = false;
        },
    },
    computed: {
        form() {
            return this.$store.getters['contacts/dialog'].form;
        },
        formBusy() {
            return this.$store.getters['contacts/dialog'].busy;
        },
        title() {
            return this.$store.getters['contacts/dialog'].title;
        },
        contactsLoading() {
            return this.$store.getters['contacts/all'].busy;
        },
        franchiseeMode() {
            return this.$store.getters['user/isFranchisee'];
        },
        dialogOpen: {
            get() {
                return this.$store.getters['contacts/dialog'].open;
            },
            set(val) {
                this.$store.dispatch('contacts/openDialog', {open: val});
            }
        },
        portalAdmin: {
            get() {
                return parseInt(this.form.custentity_connect_admin) === 1;
            },
            set(val) {
                this.form.custentity_connect_admin = val ? 1 : 2;
            }
        },
        portalUser: {
            get() {
                return parseInt(this.form.custentity_connect_user) === 1;
            },
            set(val) {
                this.form.custentity_connect_user = val ? 1 : 2;
            }
        },
    },
};
</script>

<style scoped>

</style>