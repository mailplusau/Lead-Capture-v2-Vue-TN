<template>
    <v-card flat color="background">
        <v-container class="pa-6">
            <v-row justify="start">
                <v-data-table :headers="userNotesColumns" :items="userNotes" :loading="loading"
                              no-data-text="No Note to Show" :items-per-page="-1"
                              class="elevation-0 background col-12"
                              loading-text="Loading user notes...">
                    <template v-slot:top>
                        <v-toolbar flat dense color="background darken-3" dark>
                            <v-toolbar-title class="subtitle-1">User Notes</v-toolbar-title>
                            <v-divider class="mx-4" inset vertical></v-divider>
                            <v-toolbar-title class="caption yellow--text">
                                <span></span>
                            </v-toolbar-title>

                            <v-spacer></v-spacer>

                            <v-dialog v-model="dialogOpen" width="50vw" :persistent="formBusy" eager>
                                <template v-slot:activator="{ on, attrs }">
                                    <v-btn color="success" small :disabled="loading"
                                           v-bind="attrs" v-on="on">
                                        Create new note
                                    </v-btn>
                                </template>

                                <v-card class="background">
                                    <v-container>
                                        <v-form ref="form" v-model="valid" lazy-validation :disabled="formBusy">
                                            <v-row>
                                                <v-col cols="12"><p class="text-h5 text-center">Create New Note</p></v-col>

                                                <v-col cols="12">
                                                    <v-text-field label="Title" v-model="form.title" dense
                                                                  :rules="[v => validate(v, 'required')]"
                                                    ></v-text-field>
                                                </v-col>

                                                <v-col cols="6">
                                                    <v-autocomplete label="Direction" dense
                                                                    v-model="form.direction"
                                                                    :items="directionOptions"
                                                                    :rules="[v => validate(v, 'required')]"
                                                    ></v-autocomplete>
                                                </v-col>

                                                <v-col cols="6">
                                                    <v-autocomplete label="Note Type" dense
                                                                    v-model="form.notetype"
                                                                    :items="noteTypeOptions"
                                                                    :rules="[v => validate(v, 'required')]"
                                                    ></v-autocomplete>
                                                </v-col>

                                                <v-col cols="12">
                                                    <v-textarea label="Notes" v-model="form.note" dense
                                                                :rules="[v => validate(v, 'required')]"
                                                                ></v-textarea>
                                                </v-col>
                                            </v-row>
                                        </v-form>
                                    </v-container>

                                    <v-card-actions class="pb-5">
                                        <v-spacer></v-spacer>
                                        <v-btn color="red darken-1" dark class="mx-3" @click="dialogOpen = false" :disabled="formBusy">
                                            Cancel
                                        </v-btn>
                                        <v-btn color="green darken-1" dark class="mx-3" @click="saveForm" :disabled="formBusy">
                                            Save
                                        </v-btn>
                                        <v-spacer></v-spacer>
                                    </v-card-actions>
                                </v-card>
                            </v-dialog>
                        </v-toolbar>
                    </template>
                </v-data-table>
            </v-row>
        </v-container>
    </v-card>
</template>

<script>
import {allowOnlyNumericalInput, rules} from '@/utils/utils.mjs';

export default {
    name: "UserNote",
    data: () => ({
        valid: true,
        userNotesColumns: [
            {value: 'note_date', text: 'Create Date'},
            {value: 'author', text: 'Organizer', align: 'center'},
            {value: 'message', text: 'Message', align: 'center'},
        ],
    }),
    methods: {
        validate: rules.validate,
        allowOnlyNumericalInput,
        saveForm() {
            let res = this.$refs.form.validate();
            console.log('Form validation result', res);
            if (!res) return;
            console.log('Form validated, let\'s go');
            this.$store.dispatch('extra-info/createUserNote');
        },
    },
    computed: {
        userNotes() {
            return this.$store.getters['extra-info/userNote'].data;
        },
        form() {
            return this.$store.getters['extra-info/userNote'].dialog.form;
        },
        formBusy() {
            return this.$store.getters['extra-info/userNote'].dialog.busy;
        },
        disabled() {
            return this.$store.getters['extra-info/userNote'].disabled;
        },
        loading() {
            return this.$store.getters['extra-info/userNote'].loading;
        },
        dialogOpen: {
            get() {
                return this.$store.getters['extra-info/userNote'].dialog.open;
            },
            set(val) {
                if (val) this.$refs.form.resetValidation();
                this.$store.getters['extra-info/userNote'].dialog.open = val;
            }
        },
        directionOptions() {
            return this.$store.getters['extra-info/userNote'].directionOptions;
        },
        noteTypeOptions() {
            return this.$store.getters['extra-info/userNote'].noteTypeOptions;
        },
    }
};
</script>

<style scoped>

</style>