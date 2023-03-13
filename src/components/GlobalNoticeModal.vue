<template>

    <b-modal id="modal-contact-deletion" centered v-model="modalOpen" @hide="handleModalHide">
        <template v-slot:modal-header>
            <h5 class="text-center">{{globalModal.title}}</h5>
        </template>

        <b-row class="justify-content-center">
            <b-col cols="12" class="text-center" v-show="globalModal.busy">
                <b-spinner variant="primary"
                ></b-spinner>
            </b-col>
            <b-col cols="12" class="text-center">
                {{globalModal.body}}
            </b-col>
        </b-row>

        <template v-slot:modal-footer>
            <b-button size="sm" :disabled="globalModal.busy" @click="modalOpen = false">Okie Dokie</b-button>
        </template>
    </b-modal>

</template>

<script>
export default {
    name: "GlobalNoticeModal",
    methods: {
        handleModalHide(event) {
            if(this.globalModal.busy) event.preventDefault();
        },
    },
    computed: {
        globalModal() {
            return this.$store.getters['globalModal'];
        },
        modalOpen: {
            get() {
                return this.globalModal.open;
            },
            set(val) {
                return this.$store.commit('setGlobalModal', val);
            }
        }
    }
}
</script>

<style scoped>

</style>