<template>
    <v-dialog v-model="dialogOpen" max-width="550">
        <v-card class="background">
            <v-card-title class="text-h5">
                Delete contact #{{$store.getters['contacts/idToDelete']}}?
            </v-card-title>

            <v-card-text class="subtitle-1">
                The contact to be deleted contains the following information:
            </v-card-text>
            <v-card-text class="subtitle-2 contact-details">
                <p>Name: {{contact.salutation}} {{contact.firstname}} {{contact.lastname}}</p>
                <p>Role: {{getRoleText(contact.contactrole)}}</p>
                <p>Title/Position: {{contact.title}}</p>
                <p>Phone: {{contact.phone}}</p>
                <p>Email: {{contact.email}}</p>
            </v-card-text>
            <v-card-text class="red--text subtitle-1">
                Please confirm that you really want to delete this contact. This action cannot be undone.
            </v-card-text>

            <v-divider></v-divider>
            <v-card-actions>
                <v-btn color="red darken-1" text @click="proceed">
                    delete
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn color="green darken-1" text @click="dialogOpen = false">
                    Cancel
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    name: "ContactDeletionDialog",
    methods: {
        getRoleText(roleId) {
            let index = this.$store.getters['misc/roles'].findIndex(item => item.value === roleId);
            return index >= 0 ? this.$store.getters['misc/roles'][index].text : '[N/A]';
        },
        proceed() {
            this.$store.dispatch('contacts/remove');
        },
    },
    computed: {
        dialogOpen: {
            get() {
                return !!this.$store.getters['contacts/idToDelete'];
            },
            set(val) {
                if (!val) this.$store.commit('contacts/setIdToDelete');
            }
        },
        contactInternalId() {
            return this.$store.getters['contacts/idToDelete'];
        },
        contact() {
            let index = this.$store.getters['contacts/all'].data.findIndex(item => item.internalid === this.contactInternalId);
            return index >= 0 ? this.$store.getters['contacts/all'].data[index] : {};
        }
    }
};
</script>

<style scoped>
.contact-details > p {
    margin-bottom: 2px;
}
</style>