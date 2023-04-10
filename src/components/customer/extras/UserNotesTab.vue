<template>
    <b-tab title="User Notes">
        <h2>Users Notes</h2>

        <b-row>
            <div class="col-12 mb-4">
                <b-button variant="primary" :disabled="busy" size="sm" @click="newNoteModal.open = true">
                    Create User Note
                </b-button>
            </div>
            <b-table :items="userNotes" :fields="userNotesColumns" head-row-variant="light" striped show-empty
                     label-sort-asc="" label-sort-desc="" label-sort-clear="" :busy="busy"></b-table>
        </b-row>

        <b-modal centered v-model="newNoteModal.open" static @hide="handleModalHide" size="lg">
            <template v-slot:modal-header>
                <h1 class="text-center">Create New User Note</h1>
            </template>

            <div class="row">
                <div class="col-12 mb-3">
                    <b-input-group prepend="Title">
                        <b-form-input v-model="newNoteForm.title" v-validate="'required'" data-vv-name="title"
                                      :class="errors.has('title') ? 'is-invalid' : ''" :disabled="newNoteModal.busy"></b-form-input>

                        <b-form-invalid-feedback :state="!errors.has('title')">{{ errors.first('title') }}</b-form-invalid-feedback>
                    </b-input-group>
                </div>

                <div class="col-6 mb-3">
                    <b-input-group prepend="Direction">
                        <b-form-select v-model="newNoteForm.direction" v-validate="'required'" data-vv-name="direction"
                                       :options="$store.getters['user-notes/directionOptions']"
                                       :class="errors.has('direction') ? 'is-invalid' : ''" :disabled="newNoteModal.busy"></b-form-select>

                        <b-form-invalid-feedback :state="!errors.has('direction')">{{ errors.first('direction') }}</b-form-invalid-feedback>
                    </b-input-group>
                </div>

                <div class="col-6 mb-3">
                    <b-input-group prepend="Note Type">
                        <b-form-select v-model="newNoteForm.notetype" v-validate="'required'" data-vv-name="note_type"
                                       :options="$store.getters['user-notes/noteTypeOptions']"
                                       :class="errors.has('note_type') ? 'is-invalid' : ''" :disabled="newNoteModal.busy"></b-form-select>

                        <b-form-invalid-feedback :state="!errors.has('note_type')">{{ errors.first('note_type') }}</b-form-invalid-feedback>
                    </b-input-group>
                </div>

                <b-col cols="12" class="mb-3">
                    <b-form-group class="text-start" label="Notes:" description="">
                        <b-form-textarea v-model="newNoteForm.note" rows="5" no-resize :disabled="newNoteModal.busy"></b-form-textarea>
                    </b-form-group>
                </b-col>
            </div>

            <template v-slot:modal-footer>
                <b-button size="sm" :disabled="newNoteModal.busy" @click="newNoteModal.open = false">Cancel</b-button>
                <b-button size="sm" variant="success" :disabled="newNoteModal.busy"
                          @click="createNewUserNote">
                    {{newNoteModal.busy ? 'Creating Note. Please wait...' : 'Create Note'}}
                    <b-spinner type="grow" v-show="newNoteModal.busy" style="width:1rem;height:0.1rem"></b-spinner>
                </b-button>
            </template>
        </b-modal>
    </b-tab>
</template>

<script>
export default {
    name: "UserNotesTab",
    data: () => ({
        userNotesColumns: [
            {key: 'note_date', label: 'Create Date'},
            {key: 'author', label: 'Organizer'},
            {key: 'message', label: 'Message'},
        ],
    }),
    methods: {
        handleModalHide(event) {
            if(this.newNoteModal.busy) event.preventDefault();
        },
        createNewUserNote() {
            this.$validator.validateAll().then((result) => {
                if (result) {
                    console.log('Form Submitted!');
                    this.$store.dispatch('user-notes/createNewUserNote');
                } else console.log('Correct them errors!');
            });
        },
    },
    computed: {
        userNotes() {
            return this.$store.getters['user-notes/get'];
        },
        busy() {
            return this.$store.getters['user-notes/busy'];
        },
        newNoteModal() {
            return this.$store.getters['user-notes/newNoteModal'];
        },
        newNoteForm() {
            return this.newNoteModal.form;
        }
    }
}
</script>

<style scoped>

</style>