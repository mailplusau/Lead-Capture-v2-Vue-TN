import Vue from 'vue';

export const baseURL = 'https://' + process.env.VUE_APP_NS_REALM + '.app.netsuite.com';

export const VARS = {
    customer: {
        basicFields: {
            entityid: null,
            companyname: '',
            vatregnumber: '', // ABN
            custentity_website_page_url: '', // Website
            custentity_previous_carrier: '', // Previous carrier
            email: '', // Account (main) email
            altphone: '', // Account (main) phone
            custentity_email_service: '', // Day-to-day email
            phone: '', // Day-to-day phone
            custentity_industry_category: '19', // Industry, defaulted to Other Services (19)
            leadsource: '',
            partner: '', // Associated franchisee
            entitystatus: 6, // Customer status, defaulted to SUSPECT - New (6)
            custentity_old_zee: '', // Old franchisee (use for Change of Entity or Relocation stats)
            custentity_old_customer: '', // Former internal id (use for Change of Entity or Relocation stats)
            custentity_new_zee: '',
            custentity_new_customer: '',

            custentity_mp_toll_salesrep: '', // Account Manager ID

            custentity_maap_bankacctno: null,
            custentity_maap_bankacctno_parent: null,

            custentity_date_lead_entered: new Date(), // Date when the lead is entered, default to today

            custentity_invoice_method: 2, // Invoice method: Email (default)
            custentity_invoice_by_email: true, // Invoice by email
            custentity18: true, // EXCLUDE FROM BATCH PRINTING

            custentity_operation_notes: '',
        },
        extraInfoFields: {
            custentity_invoice_method: null, // Invoice method
            custentity_accounts_cc_email: null, // Account CC email
            custentity_mpex_po: null, // MPEX PO
            custentity11: null, // Customer PO number
            custentity_mpex_invoicing_cycle: null, // Invoice cycle ID
            terms: null, // Term(?)
            custentity_finance_terms: null, // Customer's Term

            custentity_customer_pricing_notes: '', // Pricing Notes

            custentity_portal_cc_payment: '', // Portal Credit Card Payment
        }
    },
    franchisee: {
        basicFields: {
            companyname: null, // Franchisee name
            custentity3: null, // Main contact name
            email: null, // Franchisee email
            custentity2: null, // Main contact phone
            custentity_abn_franchiserecord: null, // Franchise ABN
        }
    },
    addressFields: { // address fields and default values
        addr1: '',
        addr2: '',
        city: '',
        state: '',
        zip: '',
        country: 'AU',
        addressee: '', // company name
        custrecord_address_lat: '',
        custrecord_address_lon: '',
        custrecord_address_ncl: '',
    },
    addressSublistFields: { // address sublist fields and default values
        internalid: null,
        label: '',
        defaultshipping: false,
        defaultbilling: false,
        isresidential: false,
    },
    contactFields: {
        internalid: null,
        salutation: '',
        firstname: '',
        lastname: '',
        phone: '',
        email: '',
        contactrole: '',
        title: '',
        company: null, // internal id of customer record
        entityid: '',
        custentity_connect_admin: 2,
        custentity_connect_user: 2,
    },
}

export const rules = {
    email(value, fieldName = 'This field') {
        return !value || /.+@.+\..+/.test(value) || `${fieldName} must be a valid email`;
    },
    required(value, fieldName = 'This field') {
        return !!value || `${fieldName} is required`;
    },
    minLength(value, fieldName = 'This field', length) {
        return (value && value.length >= length) || `${fieldName} must be more than ${length} characters`;
    },
    abn(value, fieldName = 'This field') {
        if (!value) return true;

        let weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
            checksum = value.split('').map(Number).reduce(
                function(total, digit, index) {
                    if (!index) {
                        digit--;
                    }
                    return total + (digit * weights[index]);
                },
                0
            );

        return value.length === 11 || !(!checksum || checksum % 89 !== 0) || `${fieldName} must be a valid ABN`;
    },
    ausPhone(value, fieldName = 'This field') {
        let australiaPhoneFormat = /^(\+\d{2}[ -]{0,1}){0,1}(((\({0,1}[ -]{0,1})0{0,1}\){0,1}[2|3|7|8]{1}\){0,1}[ -]*(\d{4}[ -]{0,1}\d{4}))|(1[ -]{0,1}(300|800|900|902)[ -]{0,1}((\d{6})|(\d{3}[ -]{0,1}\d{3})))|(13[ -]{0,1}([\d -]{5})|((\({0,1}[ -]{0,1})0{0,1}\){0,1}4{1}[\d -]{8,10})))$/;
        return !value || australiaPhoneFormat.test(value) || `${fieldName} must be a valid phone number`;
    },

    validate(v, validationString, fieldName = 'This field') {
        let validations = validationString.split('|');

        for (let validation of validations) {
            if (validation === 'validate') continue;

            let terms = validation.split(':');
            let rule = terms.shift();
            terms = terms.length ? terms[0].split(',') : [];
            let result = rules[rule] ? rules[rule](v, fieldName || 'Field', ...terms) : null;

            if (typeof result === 'string') return result;
        }

        return true
    }
}

export function getTodayDate() {
    return new Date(new Date().setHours(new Date().getTimezoneOffset()/-60, 0, 0))
}

export function readFileAsBase64(fileObject) {
    return new Promise((resolve, reject) => {
        if (!fileObject) resolve(null);

        let reader = new FileReader();

        reader.onload = (event) => {
            try {
                resolve(event.target.result.split(',')[1]);
            } catch (e) {reject(e);}
        }
        reader.readAsDataURL(fileObject);
    });
}

export function getImageDimension(fileObject) {
    return new Promise((resolve, reject) => {
        let _URL = window.URL || window.webkitURL;
        let img = new Image();
        let objectUrl = _URL.createObjectURL(fileObject);
        img.onload = function () {
            resolve({width: this.width, height: this.height})
            _URL.revokeObjectURL(objectUrl);
        };
        img.onerror = e => { reject(e); }
        img.src = objectUrl;
    })
}

export function convertImageToPngBase64(fileObject) {
    return new Promise((resolve, reject) => {
        let _URL = window.URL || window.webkitURL;
        let img = new Image();
        let objectUrl = _URL.createObjectURL(fileObject);
        img.onload = function () {
            let canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext("2d").drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpg', 1));
            canvas.remove();
            img.remove();
            _URL.revokeObjectURL(objectUrl);
        };
        img.onerror = e => { reject(e); }
        img.src = objectUrl;
    })
}

export function setObjectValueInArray(array, index, key, value) {
    let newObj = JSON.parse(JSON.stringify(array[index]));
    newObj[key] = value;
    Vue.set(array, index, newObj);
}

export function setObjectInArray(array, index, newObj) {
    Vue.set(array, index, newObj);
}

export function allowOnlyNumericalInput(evt) {
    // evt = (evt) ? evt : window.event;
    let expect = evt.target.value.toString() + evt.key.toString();

    // if (!/^[-+]?[0-9]*?[0-9]*$/.test(expect)) // Allow only 1 leading + sign and numbers
    if (!/^[0-9]*$/.test(expect)) // Allow only numbers
        evt.preventDefault();
    else return true;
}

export function debounce(fn, wait){
    let timer;
    return function(...args){
        if(timer) {
            clearTimeout(timer); // clear any pre-existing timer
        }
        const context = this; // get the current context
        timer = setTimeout(()=>{
            fn.apply(context, args); // call the function if time expires
        }, wait);
    }
}