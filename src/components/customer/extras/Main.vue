<template>
    <b-card border-variant="primary" bg-variant="transparent" class="my-3" style="padding: 0">
        <b-tabs content-class="mt-3" fill>
            <ServicePricingNotesTab />
            <b-tab title="MP Express & Standard" disabled><p>I'm the second tab</p></b-tab>
            <b-tab title="Additional Information" disabled><p>I'm the tab with the very, very long title</p></b-tab>
            <b-tab title="User Notes" disabled><p>I'm a disabled tab!</p></b-tab>
        </b-tabs>
    </b-card>
</template>

<script>
import ServicePricingNotesTab from "./ServicePricingNotesTab";
export default {
    name: "Main",
    components: {ServicePricingNotesTab}
}
</script>

<style scoped>

</style>