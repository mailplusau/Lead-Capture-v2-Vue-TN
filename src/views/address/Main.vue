<template>
    <v-container>
        <v-row>
            <v-col cols="12" class="text-center">
                <AddressTable />
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import AddressTable from '@/views/address/AddressTable';

export default {
    name: "Main",
    components: {AddressTable}
};
</script>

<style scoped>

</style>