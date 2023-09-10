<template>
    <v-container>
        <v-row>
            <v-col cols="12" class="text-center">
                <ContactTable />
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import ContactTable from '@/views/contact/ContactTable';

export default {
    name: "Main",
    components: {ContactTable}
};
</script>

<style scoped>

</style>