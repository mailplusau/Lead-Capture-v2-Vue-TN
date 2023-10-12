<template>
    <v-container @dragover="dragover" @dragleave="dragleave" @drop="drop" ref="mainDropZone">
        <v-row>
            <v-col cols="12">
                <v-toolbar flat dense color="primary" dark>
                    <v-toolbar-title>Photos of the business</v-toolbar-title>
                    <v-divider class="mx-4" inset vertical></v-divider>
                    <v-toolbar-title class="caption yellow--text">
                        {{ message }}
                    </v-toolbar-title>

                    <v-spacer></v-spacer>

<!--                    <v-btn class="mr-2" small @click="$store.dispatch('uploadImages', 1784287)">test</v-btn>-->
                    <v-btn v-show="files.length" color="red" class="mr-2" small @click="dialog = true">remove all</v-btn>
                    <v-btn color="success" small @click="openFileDialog">browse for files</v-btn>
                </v-toolbar>
                <v-card min-height="200px" class="background main" elevation="5">
                    <v-container fluid v-if="files.length">
                        <v-row align="center">
                            <v-col v-for="(file, index) in filePreviews" :key="file.name" lg="3" md="3" sm="4" cols="12">
                                <v-card class="mx-auto fill-height" @click.stop="previewFile(index)" elevation="4">
                                    <v-img height="250" :src="file.preview" class="white--text align-end"
                                           :gradient="'to bottom, rgba(0,0,0,0), rgba(0,0,0,.7)'">
                                        <v-btn color="red" small class="image-delete-btn" elevation="5"
                                               @click.stop="remove(index)" dark>
                                            <v-icon small>mdi-close</v-icon>
                                        </v-btn>
                                        <v-card-title class="py-2 caption">{{ file.name }}</v-card-title>
                                    </v-img>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-container>
                    <v-container v-else fluid style="min-height: 200px" class="fill-height">
                        <v-row justify="center" align="center" no-gutters>
                            <v-col cols="auto">
                                <v-icon size="50">mdi-cloud-upload-outline</v-icon>
                            </v-col>
                            <v-col cols="12" class="text-center subtitle-1">
                                <span>...or drop them here to upload.</span>
                            </v-col>
                        </v-row>
                    </v-container>

                    <div :class="'dropzone-container ' + (isDragging ? '' : 'dropzone-container-hide')" @dragover="dragover">
                        <input type="file" name="file"
                            id="fileInput" class="hidden-input"
                            @change="onChange"
                            ref="file"
                            accept=".jpg,.jpeg,.png,.bmp,.gif,.tiff"/>

                        <label for="fileInput" class="file-label">
                            <span v-if="isDragging">Release to drop files here.</span>
                        </label>
                    </div>
                </v-card>
            </v-col>
        </v-row>


        <v-dialog v-model="dialog" max-width="350">
            <v-card class="background">
                <v-card-title class="text-h6">
                    Remove all files?
                </v-card-title>

                <v-card-text class="subtitle-1">
                    You are about to remove {{files.length}} pending files. This is irreversible. Are you sure?
                </v-card-text>

                <v-divider></v-divider>
                <v-card-actions>
                    <v-btn color="red darken-1" text @click="removeAllFiles">
                        remove all
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="green darken-1" text @click="dialog = false">
                        Cancel
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>


        <v-dialog
            v-model="previewDialog"
            fullscreen
            hide-overlay
            scrollable
            transition="dialog-bottom-transition"
        >
            <v-card>
                <v-toolbar dark color="primary">
                    <v-toolbar-title>
                        Previewing Image
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-toolbar-items>
                        <v-btn color="yellow" text @click="closePreviewDialog">
                            Done & close
                        </v-btn>
                    </v-toolbar-items>
                </v-toolbar>

                <v-divider></v-divider>

                <v-img v-if="previewDialog && previewImg" :src="previewImg"></v-img>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script>
export default {
    name: "FileDropZone",
    props: ['value', 'disabled', 'message'],
    data() {
        return {
            isDragging: false,
            files: [],
            dialog: false,
            previewDialog: false,
            previewImg: null
        };
    },
    methods: {
        previewFile(index) {
            let fileSrc = URL.createObjectURL(this.files[index]);
            setTimeout(() => {
                URL.revokeObjectURL(fileSrc);
            }, 1000);
            this.previewImg = fileSrc;
            this.previewDialog = true;
        },
        closePreviewDialog() {
            this.previewImg = null;
            this.previewDialog = false;
        },
        openFileDialog() {
            if (this.disabled) return;
            this.$refs.file.click();
        },
        removeAllFiles() {
            this.files.splice(0);
            this.dialog = false;
        },

        generateURL(file) {
            let fileSrc = URL.createObjectURL(file);
            setTimeout(() => {
                URL.revokeObjectURL(fileSrc);
            }, 1000);
            return fileSrc;
        },
        onChange() {
            [...this.$refs.file.files].forEach(file => {
                if (!(/\.(gif|jpe?g|tiff|png|bmp)$/i).test(file.name)) return;

                if (file.size > 1024*10240) return;

                let index = this.files.findIndex(item => item.name === file.name && item.size === file.size);
                if (index < 0) this.files.push(file);
            })
        },
        dragover(e) {
            e.preventDefault();
            if (this.disabled) return;
            this.isDragging = true;
        },
        dragleave(e) {
            if (this.$refs.mainDropZone.contains(e['fromElement'])) return;
            this.isDragging = false;
        },
        drop(e) {
            if (this.disabled) return;
            e.preventDefault();
            this.$refs.file.files = e.dataTransfer.files;
            this.onChange();
            this.isDragging = false;
        },
        remove(i) {
            this.files.splice(i, 1);
        },
    },
    computed: {
        filePreviews() {
            return this.files.map(file => ({
                name: file.name,
                size: file.size,
                preview: this.generateURL(file)
            }))
        }
    },
    watch: {
        files(val) {
            this.$emit('input', val)
        }
    }
}
</script>

<style scoped>
.main {
    position: relative;
}
.dropzone-container-hide {
    opacity: 0 !important;
}
.dropzone-container {
    opacity: 0.8;
    pointer-events: none;
    padding: 4rem;
    background: #f7fafc;border: 3px dashed black;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-content: center;
    justify-content: center;
    flex-direction: column;
    flex-wrap: wrap;
    z-index: 2
}

.hidden-input {
    opacity: 0;
    overflow: hidden;
    position: absolute;
    width: 1px;
    height: 1px;
}
.file-label {
    font-size: 20px;
    cursor: pointer;
}
.image-delete-btn {
    position: absolute;
    top: 10px;
    right: 10px;
}
</style>