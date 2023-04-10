<template>
    <b-card v-if="$store.getters['customer/showExtraTabsSection']"
            border-variant="primary" bg-variant="transparent" class="my-3" style="padding: 0">
        <b-tabs content-class="mt-3" fill>
            <ServicePricingNotesTab />
            <MPEXAndStandardTab />
            <SurveyInformationTab />
            <UserNotesTab />
        </b-tabs>
    </b-card>
</template>

<script>
import ServicePricingNotesTab from "./ServicePricingNotesTab";
import MPEXAndStandardTab from "./MPEXAndStandardTab";
import SurveyInformationTab from "./SurveyInformationTab";
import UserNotesTab from "./UserNotesTab";
export default {
    name: "Main",
    components: {UserNotesTab, SurveyInformationTab, MPEXAndStandardTab, ServicePricingNotesTab}
}
</script>

<style scoped>

</style>