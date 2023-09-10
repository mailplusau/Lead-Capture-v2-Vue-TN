<template>
    <v-row>
        <v-col cols="12">
            <v-data-table :headers="headers" :items="contacts" :loading="busy" no-data-text="No Contact to Show" :items-per-page="-1"
                          class="elevation-5 background" :hide-default-footer="contacts.length <= 10" loading-text="Loading contacts...">
                <template v-slot:top>
                    <v-toolbar flat dense color="primary" dark>
                        <v-toolbar-title>Customer's Contacts</v-toolbar-title>
                        <v-divider class="mx-4" inset vertical></v-divider>
                        <v-toolbar-title class="caption yellow--text">
                            <span></span>
                        </v-toolbar-title>

                        <v-spacer></v-spacer>

                        <ContactFormDialog />
                    </v-toolbar>
                </template>

                <template v-slot:item.contact="{ item }">
                    <span>{{item.salutation}} {{item.firstname}} {{item.lastname}} ({{item.email || 'No email provided'}})</span><br>
                    <span>{{item.phone}}</span>
                </template>

                <template v-slot:item.role="{ item }">
                    {{ getRoleText(item.contactrole) }}
                </template>

                <template v-slot:item.admin="{ item }">
                    <v-icon :color="parseInt(item.custentity_connect_admin) === 1 ? 'green' : 'red'">
                        {{ parseInt(item.custentity_connect_admin) === 1 ? 'mdi-check' : 'mdi-close'}}
                    </v-icon>
                </template>

                <template v-slot:item.user="{ item }">
                    <v-icon :color="parseInt(item.custentity_connect_user) === 1 ? 'green' : 'red'">
                        {{ parseInt(item.custentity_connect_user) === 1 ? 'mdi-check' : 'mdi-close'}}
                    </v-icon>
                </template>


                <template v-slot:item.actions="{ item }">
                    <v-card-actions>
                        <v-btn icon color="primary" @click="editContact(item.internalid)"><v-icon>mdi-pencil</v-icon></v-btn>
                        <v-btn icon color="red" @click="deleteContact(item.internalid)"><v-icon>mdi-delete</v-icon></v-btn>
                    </v-card-actions>
                </template>
            </v-data-table>
        </v-col>

        <ContactDeletionDialog />
    </v-row>
</template>

<script>
import ContactFormDialog from '@/views/contact/ContactFormDialog';
import ContactDeletionDialog from '@/views/contact/ContactDeletionDialog';

export default {
    name: "ContactTable",
    components: {ContactDeletionDialog, ContactFormDialog},
    data: () => ({
        headers: [
            {value: 'contact', text: 'Contact', align: 'start'},
            {value: 'role', text: 'Role', align: 'center', sortable: false},
            {value: 'admin', text: 'Portal Admin', align: 'center', sortable: false},
            {value: 'user', text: 'Portal User', align: 'center', sortable: false},
            {value: 'actions', text: '', align: 'end', sortable: false},
        ],
    }),
    methods: {
        editContact(contactId) {
            this.$store.dispatch('contacts/openDialog', {open: true, contactId});
        },
        deleteContact(contactId) {
            this.$store.commit('contacts/setIdToDelete', contactId);
        },
        getRoleText(roleId) {
            let index = this.$store.getters['misc/roles'].findIndex(item => parseInt(item.value) === parseInt(roleId));
            return index >= 0 ? this.$store.getters['misc/roles'][index].text : '[N/A]';
        }
    },
    computed: {
        contacts() {
            return this.$store.getters['contacts/all'].data;
        },
        busy() {
            return this.$store.getters['contacts/all'].busy;
        },
        franchiseeMode() {
            return this.$store.getters['user/isFranchisee'];
        },
    }
};
</script>

<style scoped>

</style>