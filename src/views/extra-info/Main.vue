<template>
    <v-container v-if="$store.getters['customer/id']">
        <v-row>
            <v-col cols="12" class="text-center">
                <v-tabs class="elevation-5"
                        v-model="tab"
                        background-color="primary"
                        slider-color="yellow"
                        fixed-tabs
                        dark color="red"
                >
                    <v-tabs-slider></v-tabs-slider>

                    <v-tab href="#tab-1" class="caption yellow--text">
                        Additional Information
                    </v-tab>

                    <v-tab href="#tab-2" class="caption">
                        Services & Pricing Note
                    </v-tab>

                    <v-tab href="#tab-3" class="caption">
                        MP Express & Standard
                    </v-tab>

                    <v-tab href="#tab-4" class="caption">
                        Survey
                    </v-tab>

                    <v-tab href="#tab-5" class="caption">
                        User Notes
                    </v-tab>
                </v-tabs>

                <v-tabs-items class="elevation-5" v-model="tab">
                    <v-tab-item key="1" value="tab-1">
                        <AdditionalInfo />
                    </v-tab-item>
                    <v-tab-item key="2" value="tab-2">
                        <ServicePricingNote />
                    </v-tab-item>
                    <v-tab-item key="3" value="tab-3">
                        <MPProducts />
                    </v-tab-item>
                    <v-tab-item key="4" value="tab-4">
                        <Survey />
                    </v-tab-item>
                    <v-tab-item key="5" value="tab-5">
                        <UserNote />
                    </v-tab-item>
                </v-tabs-items>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import AdditionalInfo from '@/views/extra-info/tabs/AdditionalInfo';
import ServicePricingNote from '@/views/extra-info/tabs/ServicePricingNote';
import MPProducts from '@/views/extra-info/tabs/MPProducts';
import Survey from '@/views/extra-info/tabs/Survey';
import UserNote from '@/views/extra-info/tabs/UserNote';

export default {
    name: "Main",
    components: {UserNote, Survey, MPProducts, ServicePricingNote, AdditionalInfo},
    data: () => ({
        tab: null,
    })
};
</script>

<style scoped>

</style>