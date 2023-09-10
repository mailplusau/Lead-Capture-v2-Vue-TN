<template>
    <v-container v-if="$store.getters['customer/id']">
        <v-row>
            <v-col cols="12" class="text-center">
                <InvoiceTable />
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import InvoiceTable from '@/views/invoices/InvoiceTable';
export default {
    name: "Main",
    components: {InvoiceTable}
};
</script>

<style scoped>

</style>