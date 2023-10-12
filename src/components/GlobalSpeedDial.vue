<template>
    <v-speed-dial
        v-model="fab" bottom right fixed
        :direction="'top'"
        open-on-hover
        :transition="'slide-y-reverse-transition'"
    >
        <template v-slot:activator>
            <v-btn v-model="fab" color="blue darken-2" dark fab>
                <v-icon v-if="fab">mdi-close</v-icon>
                <v-icon v-else>mdi-menu</v-icon>
            </v-btn>
        </template>
        <v-btn @click="clearStateFromLocalStorage" title="Clear temporarily saved form"
            fab dark small color="red">
            <v-icon>mdi-delete</v-icon>
        </v-btn>
    </v-speed-dial>
</template>

<script>
export default {
    name: "GlobalSpeedDial",
    data: () => ({
        fab: false,
    }),
    methods: {
        async clearStateFromLocalStorage() {
            await this.$store.dispatch('customer/clearStateFromLocalStorage');
            await this.$store.dispatch('contacts/clearStateFromLocalStorage');
            await this.$store.dispatch('addresses/clearStateFromLocalStorage');
            top.location.reload();
        }
    }
};
</script>

<style scoped>

</style>