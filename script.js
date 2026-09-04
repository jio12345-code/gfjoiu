"use strict";

/*
========================================
   KONFIGURASI
========================================
*/

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;

let currentStep = 1;
let selectedPhoto = null;
let selectedKK = null;
let selectedIjazah = null;
let registrationData = null;


/*
========================================
   ELEMENT
========================================
*/

const form = document.getElementById("registrationForm");

const steps = document.querySelectorAll(".form-step");

const progressSteps =
    document.querySelectorAll(".progress-step");

const progressLines =
    document.querySelectorAll(".progress-line");

const successPage =
    document.getElementById("successPage");

const summary =
    document.getElementById("summary");

const successSummary =
    document.getElementById("successSummary");

const toast =
    document.getElementById("toast");


/*
========================================
   INITIALIZATION
========================================
*/

document.addEventListener("DOMContentLoaded", () => {

    setupNavigation();

    setupFileUpload();

    setupInputFormatting();

    setupValidation();

    restoreDraft();

});


/*
========================================
   NAVIGATION
========================================
*/

function setupNavigation() {

    document.querySelectorAll("[data-next]").forEach(button => {

        button.addEventListener("click", () => {

            const nextStep =
                Number(button.dataset.next);

            if (validateCurrentStep()) {
                goToStep(nextStep);
            }

        });

    });


    document.querySelectorAll("[data-prev]").forEach(button => {

        button.addEventListener("click", () => {

            const previousStep =
                Number(button.dataset.prev);

            goToStep(previousStep);

        });

    });

}


function goToStep(step) {

    if (step < 1 || step > 4) {
        return;
    }

    currentStep = step;

    steps.forEach(section => {

        const sectionStep =
            Number(section.dataset.stepContent);

        section.classList.toggle(
            "active",
            sectionStep === step
        );

    });


    progressSteps.forEach(progress => {

        const progressStep =
            Number(progress.dataset.step);

        progress.classList.remove(
            "active",
            "completed"
        );

        if (progressStep === step) {

            progress.classList.add("active");

        } else if (progressStep < step) {

            progress.classList.add("completed");

        }

    });


    progressLines.forEach((line, index) => {

        line.classList.toggle(
            "active",
            index < step - 1
        );

    });


    if (step === 4) {
        buildSummary();
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/*
========================================
   VALIDATION
========================================
*/

function validateCurrentStep() {

    const currentSection =
        document.querySelector(
            `[data-step-content="${currentStep}"]`
        );

    if (!currentSection) {
        return false;
    }


    let valid = true;


    const inputs =
        currentSection.querySelectorAll(
            "input, select, textarea"
        );


    inputs.forEach(input => {

        if (
            input.type === "file" ||
            input.type === "checkbox"
        ) {
            return;
        }


        if (!validateInput(input)) {
            valid = false;
        }

    });


    /*
    STEP 3 FILE VALIDATION
    */

    if (currentStep === 3) {

        if (!selectedPhoto) {

            showFileError(
                "fotoError",
                "Foto siswa wajib diupload."
            );

            valid = false;

        }

        if (!selectedKK) {

            showFileError(
                "kkError",
                "Kartu Keluarga wajib diupload."
            );

            valid = false;

        }

        if (!selectedIjazah) {

            showFileError(
                "ijazahError",
                "Ijazah / SKL wajib diupload."
            );

            valid = false;

        }

    }


    return valid;

}


function validateInput(input) {

    const error =
        input.parentElement.querySelector(".error");


    if (!error) {
        return true;
    }


    const value =
        input.value.trim();


    input.classList.remove("invalid");

    error.textContent = "";


    /*
    REQUIRED
    */

    if (
        input.required &&
        !value
    ) {

        input.classList.add("invalid");

        error.textContent =
            "Field ini wajib diisi.";

        return false;

    }


    /*
    NIK
    */

    if (input.id === "nik" && value) {

        if (!/^\d{16}$/.test(value)) {

            input.classList.add("invalid");

            error.textContent =
                "NIK harus terdiri dari 16 digit.";

            return false;

        }

    }


    /*
    NISN
    */

    if (input.id === "nisn" && value) {

        if (!/^\d{10}$/.test(value)) {

            input.classList.add("invalid");

            error.textContent =
                "NISN harus terdiri dari 10 digit.";

            return false;

        }

    }


    /*
    EMAIL
    */

    if (
        input.type === "email" &&
        value
    ) {

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailRegex.test(value)) {

            input.classList.add("invalid");

            error.textContent =
                "Format email tidak valid.";

            return false;

        }

    }


    /*
    NOMOR TELEPON
    */

    const phoneFields = [
        "telepon",
        "teleponAyah",
        "teleponIbu"
    ];


    if (
        phoneFields.includes(input.id) &&
        value
    ) {

        const cleanPhone =
            value.replace(/[\s-]/g, "");


        if (
            !/^(\+62|62|0)\d{8,13}$/.test(
                cleanPhone
            )
        ) {

            input.classList.add("invalid");

            error.textContent =
                "Nomor HP tidak valid.";

            return false;

        }

    }


    /*
    TANGGAL LAHIR
    */

    if (
        input.id === "tanggalLahir" &&
        value
    ) {

        const birthDate =
            new Date(value);

        const today =
            new Date();

        if (birthDate > today) {

            input.classList.add("invalid");

            error.textContent =
                "Tanggal lahir tidak boleh di masa depan.";

            return false;

        }

    }


    return true;

}


/*
========================================
   REALTIME VALIDATION
========================================
*/

function setupValidation() {

    const inputs =
        form.querySelectorAll(
            "input, select, textarea"
        );


    inputs.forEach(input => {

        input.addEventListener(
            "blur",
            () => {

                if (
                    input.type !== "file" &&
                    input.type !== "checkbox"
                ) {

                    validateInput(input);

                }

            }
        );

    });


    document
        .getElementById("agreement")
        .addEventListener("change", () => {

            document.getElementById(
                "agreementError"
            ).textContent = "";

        });

}


/*
========================================
   INPUT FORMATTING
========================================
*/

function setupInputFormatting() {

    const numericFields = [
        "nik",
        "nisn"
    ];


    numericFields.forEach(id => {

        const input =
            document.getElementById(id);


        input.addEventListener("input", () => {

            input.value =
                input.value.replace(/\D/g, "");

        });

    });


    const phoneFields = [
        "telepon",
        "teleponAyah",
        "teleponIbu"
    ];


    phoneFields.forEach(id => {

        const input =
            document.getElementById(id);


        input.addEventListener("input", () => {

            input.value =
                input.value.replace(
                    /[^0-9+\-\s]/g,
                    ""
                );

        });

    });

}


/*
========================================
   FILE UPLOAD
========================================
*/

function setupFileUpload() {

    const foto =
        document.getElementById("foto");

    const kk =
        document.getElementById("kk");

    const ijazah =
        document.getElementById("ijazah");


    foto.addEventListener(
        "change",
        () => {

            const file =
                foto.files[0];

            if (!file) {
                return;
            }


            if (
                !validateFile(
                    file,
                    MAX_PHOTO_SIZE,
                    [
                        "image/jpeg",
                        "image/png"
                    ],
                    "fotoError"
                )
            ) {

                foto.value = "";

                selectedPhoto = null;

                return;

            }


            selectedPhoto = file;

            showPhotoPreview(file);

        }
    );


    kk.addEventListener(
        "change",
        () => {

            const file =
                kk.files[0];

            if (!file) {
                return;
            }


            if (
                !validateFile(
                    file,
                    MAX_DOCUMENT_SIZE,
                    [
                        "application/pdf",
                        "image/jpeg",
                        "image/png"
                    ],
                    "kkError"
                )
            ) {

                kk.value = "";

                selectedKK = null;

                return;

            }


            selectedKK = file;

            document.getElementById(
                "kkName"
            ).textContent = file.name;

        }
    );


    ijazah.addEventListener(
        "change",
        () => {

            const file =
                ijazah.files[0];

            if (!file) {
                return;
            }


            if (
                !validateFile(
                    file,
                    MAX_DOCUMENT_SIZE,
                    [
                        "application/pdf",
                        "image/jpeg",
                        "image/png"
                    ],
                    "ijazahError"
                )
            ) {

                ijazah.value = "";

                selectedIjazah = null;

                return;

            }


            selectedIjazah = file;

            document.getElementById(
                "ijazahName"
            ).textContent = file.name;

        }
    );

}


function validateFile(
    file,
    maxSize,
    allowedTypes,
    errorId
) {

    const error =
        document.getElementById(errorId);


    error.textContent = "";


    if (!allowedTypes.includes(file.type)) {

        error.textContent =
            "Format file tidak didukung.";

        return false;

    }


    if (file.size > maxSize) {

        error.textContent =
            `Ukuran file terlalu besar. Maksimal ${
                maxSize / 1024 / 1024
            } MB.`;

        return false;

    }


    return true;

}


function showFileError(
    id,
    message
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = message;
    }

}


function showPhotoPreview(file) {

    const preview =
        document.getElementById(
            "photoPreview"
        );


    preview.innerHTML = "";


    const image =
        document.createElement("img");


    const objectUrl =
        URL.createObjectURL(file);


    image.src = objectUrl;

    image.alt =
        "Preview foto siswa";


    image.onload = () => {

        URL.revokeObjectURL(
            objectUrl
        );

    };


    preview.appendChild(image);

}


/*
========================================
   SUMMARY
========================================
*/

function getValue(id) {

    const element =
        document.getElementById(id);

    if (!element) {
        return "-";
    }

    return element.value.trim() || "-";

}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function createSummaryGroup(
    title,
    rows
) {

    const group =
        document.createElement("div");

    group.className =
        "summary-group";


    const titleElement =
        document.createElement("div");

    titleElement.className =
        "summary-title";

    titleElement.textContent =
        title;


    group.appendChild(titleElement);


    rows.forEach(row => {

        const rowElement =
            document.createElement("div");

        rowElement.className =
            "summary-row";


        const label =
            document.createElement("div");

        label.className =
            "summary-label";

        label.textContent =
            row[0];


        const value =
            document.createElement("div");

        value.className =
            "summary-value";

        value.textContent =
            row[1];


        rowElement.appendChild(label);

        rowElement.appendChild(value);

        group.appendChild(rowElement);

    });


    return group;

}


function buildSummary() {

    summary.innerHTML = "";


    const studentGroup =
        createSummaryGroup(
            "Data Siswa",
            [
                [
                    "Nama",
                    getValue("nama")
                ],
                [
                    "NIK",
                    getValue("nik")
                ],
                [
                    "NISN",
                    getValue("nisn")
                ],
                [
                    "Tempat Lahir",
                    getValue("tempatLahir")
                ],
                [
                    "Tanggal Lahir",
                    getValue("tanggalLahir")
                ],
                [
                    "Jenis Kelamin",
                    getValue("jenisKelamin")
                ],
                [
                    "Agama",
                    getValue("agama")
                ],
                [
                    "Sekolah Asal",
                    getValue("sekolahAsal")
                ],
                [
                    "Jurusan",
                    getValue("jurusan")
                ],
                [
                    "Nomor HP",
                    getValue("telepon")
                ],
                [
                    "Email",
                    getValue("email")
                ],
                [
                    "Alamat",
                    getValue("alamat")
                ]
            ]
        );


    const parentGroup =
        createSummaryGroup(
            "Data Orang Tua / Wali",
            [
                [
                    "Nama Ayah",
                    getValue("namaAyah")
                ],
                [
                    "Pekerjaan Ayah",
                    getValue("pekerjaanAyah")
                ],
                [
                    "Nomor HP Ayah",
                    getValue("teleponAyah")
                ],
                [
                    "Nama Ibu",
                    getValue("namaIbu")
                ],
                [
                    "Pekerjaan Ibu",
                    getValue("pekerjaanIbu")
                ],
                [
                    "Nomor HP Ibu",
                    getValue("teleponIbu")
                ],
                [
                    "Nama Wali",
                    getValue("namaWali")
                ],
                [
                    "Penghasilan",
                    getValue("penghasilan")
                ],
                [
                    "Pendidikan",
                    getValue("pendidikanOrtu")
                ]
            ]
        );


    const documentGroup =
        createSummaryGroup(
            "Dokumen",
            [
                [
                    "Foto",
                    selectedPhoto
                        ? selectedPhoto.name
                        : "-"
                ],
                [
                    "Kartu Keluarga",
                    selectedKK
                        ? selectedKK.name
                        : "-"
                ],
                [
                    "Ijazah / SKL",
                    selectedIjazah
                        ? selectedIjazah.name
                        : "-"
                ]
            ]
        );


    summary.appendChild(studentGroup);

    summary.appendChild(parentGroup);

    summary.appendChild(documentGroup);

}


/*
========================================
   SUBMIT
========================================
*/

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        /*
        Pastikan semua step valid
        */

        const previousStep =
            currentStep;


        currentStep = 1;

        const step1Valid =
            validateCurrentStep();


        currentStep = 2;

        const step2Valid =
            validateCurrentStep();


        currentStep = 3;

        const step3Valid =
            validateCurrentStep();


        currentStep =
            previousStep;


        if (
            !step1Valid ||
            !step2Valid ||
            !step3Valid
        ) {

            let firstInvalidStep = 1;


            if (!step1Valid) {
                firstInvalidStep = 1;

            } else if (!step2Valid) {
                firstInvalidStep = 2;

            } else {
                firstInvalidStep = 3;
            }


            goToStep(firstInvalidStep);

            showToast(
                "Masih ada data yang belum lengkap."
            );

            return;

        }


        /*
        Agreement
        */

        const agreement =
            document.getElementById(
                "agreement"
            );


        if (!agreement.checked) {

            document.getElementById(
                "agreementError"
            ).textContent =
                "Anda harus menyetujui pernyataan.";

            showToast(
                "Silakan centang pernyataan."
            );

            return;

        }


        /*
        Buat nomor pendaftaran
        */

        const registrationNumber =
            generateRegistrationNumber();


        /*
        Simpan data
        */

        registrationData = {

            registrationNumber,

            submittedAt:
                new Date().toISOString(),

            nama:
                getValue("nama"),

            nik:
                getValue("nik"),

            nisn:
                getValue("nisn"),

            tempatLahir:
                getValue("tempatLahir"),

            tanggalLahir:
                getValue("tanggalLahir"),

            jenisKelamin:
                getValue("jenisKelamin"),

            agama:
                getValue("agama"),

            sekolahAsal:
                getValue("sekolahAsal"),

            jurusan:
                getValue("jurusan"),

            telepon:
                getValue("telepon"),

            email:
                getValue("email"),

            alamat:
                getValue("alamat"),

            namaAyah:
                getValue("namaAyah"),

            pekerjaanAyah:
                getValue("pekerjaanAyah"),

            teleponAyah:
                getValue("teleponAyah"),

            namaIbu:
                getValue("namaIbu"),

            pekerjaanIbu:
                getValue("pekerjaanIbu"),

            teleponIbu:
                getValue("teleponIbu"),

            namaWali:
                getValue("namaWali"),

            penghasilan:
                getValue("penghasilan"),

            pendidikanOrtu:
                getValue("pendidikanOrtu"),

            foto:
                selectedPhoto
                    ? selectedPhoto.name
                    : "-",

            kk:
                selectedKK
                    ? selectedKK.name
                    : "-",

            ijazah:
                selectedIjazah
                    ? selectedIjazah.name
                    : "-"

        };


        /*
        localStorage
        */

        try {

            localStorage.setItem(
                "ppdbRegistration",
                JSON.stringify(
                    registrationData
                )
            );

        } catch (error) {

            console.warn(
                "localStorage tidak tersedia:",
                error
            );

        }


        /*
        Tampilkan sukses
        */

        document.getElementById(
            "registrationNumber"
        ).textContent =
            registrationNumber;


        successSummary.innerHTML = "";

        successSummary.appendChild(
            createSummaryGroup(
                "Data Pendaftaran",
                [
                    [
                        "Nama",
                        registrationData.nama
                    ],
                    [
                        "NISN",
                        registrationData.nisn
                    ],
                    [
                        "Jurusan",
                        registrationData.jurusan
                    ],
                    [
                        "Sekolah Asal",
                        registrationData.sekolahAsal
                    ],
                    [
                        "Email",
                        registrationData.email
                    ]
                ]
            )
        );


        form.style.display = "none";

        document.querySelector(
            ".progress-wrapper"
        ).style.display = "none";

        document.querySelector(
            ".hero"
        ).style.display = "none";


        successPage.classList.add("active");


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


/*
========================================
   GENERATE REGISTRATION NUMBER
========================================
*/

function generateRegistrationNumber() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const random =
        Math.floor(
            100000 +
            Math.random() * 900000
        );


    return `PPDB-${year}-${random}`;

}


/*
========================================
   DOWNLOAD BUKTI
========================================
*/

document
    .getElementById("downloadButton")
    .addEventListener(
        "click",
        () => {

            if (!registrationData) {
                return;
            }


            const data =
                registrationData;


            const html = `
<!DOCTYPE html>

<html lang="id">

<head>

<meta charset="UTF-8">

<title>
Bukti Pendaftaran ${escapeHTML(
    data.registrationNumber
)}
</title>

<style>

body {
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 40px auto;
    padding: 20px;
    color: #172033;
}

.header {
    text-align: center;
    border-bottom: 2px solid #2563eb;
    padding-bottom: 20px;
    margin-bottom: 25px;
}

.number {
    background: #eff6ff;
    padding: 15px;
    text-align: center;
    margin: 20px 0;
}

.number strong {
    display: block;
    color: #2563eb;
    font-size: 24px;
    margin-top: 5px;
}

table {
    width: 100%;
    border-collapse: collapse;
}

td {
    border: 1px solid #ddd;
    padding: 10px;
}

td:first-child {
    width: 35%;
    background: #f8fafc;
    font-weight: bold;
}

.footer {
    margin-top: 35px;
    color: #64748b;
    font-size: 12px;
}

</style>

</head>

<body>

<div class="header">

<h1>SMA NUSANTARA</h1>

<p>
Bukti Pendaftaran Peserta Didik Baru
</p>

</div>


<div class="number">

Nomor Pendaftaran

<strong>
${escapeHTML(
    data.registrationNumber
)}
</strong>

</div>


<h2>Data Siswa</h2>

<table>

<tr>
<td>Nama</td>
<td>${escapeHTML(data.nama)}</td>
</tr>

<tr>
<td>NIK</td>
<td>${escapeHTML(data.nik)}</td>
</tr>

<tr>
<td>NISN</td>
<td>${escapeHTML(data.nisn)}</td>
</tr>

<tr>
<td>Tempat Lahir</td>
<td>${escapeHTML(data.tempatLahir)}</td>
</tr>

<tr>
<td>Tanggal Lahir</td>
<td>${escapeHTML(data.tanggalLahir)}</td>
</tr>

<tr>
<td>Jenis Kelamin</td>
<td>${escapeHTML(data.jenisKelamin)}</td>
</tr>

<tr>
<td>Agama</td>
<td>${escapeHTML(data.agama)}</td>
</tr>

<tr>
<td>Sekolah Asal</td>
<td>${escapeHTML(data.sekolahAsal)}</td>
</tr>

<tr>
<td>Jurusan</td>
<td>${escapeHTML(data.jurusan)}</td>
</tr>

<tr>
<td>Email</td>
<td>${escapeHTML(data.email)}</td>
</tr>

</table>


<h2>Data Orang Tua</h2>

<table>

<tr>
<td>Nama Ayah</td>
<td>${escapeHTML(data.namaAyah)}</td>
</tr>

<tr>
<td>Pekerjaan Ayah</td>
<td>${escapeHTML(data.pekerjaanAyah)}</td>
</tr>

<tr>
<td>Nama Ibu</td>
<td>${escapeHTML(data.namaIbu)}</td>
</tr>

<tr>
<td>Pekerjaan Ibu</td>
<td>${escapeHTML(data.pekerjaanIbu)}</td>
</tr>

<tr>
<td>Nomor HP</td>
<td>${escapeHTML(data.teleponIbu)}</td>
</tr>

</table>


<div class="footer">

<p>
Dokumen ini merupakan bukti pendaftaran elektronik.
Simpan dokumen ini untuk keperluan verifikasi.
</p>

<p>
Dicetak pada:
${new Date().toLocaleString("id-ID")}
</p>

</div>

</body>

</html>
`;


            const blob =
                new Blob(
                    [html],
                    {
                        type: "text/html"
                    }
                );


            const url =
                URL.createObjectURL(blob);


            const link =
                document.createElement("a");


            link.href = url;

            link.download =
                `${data.registrationNumber}.html`;


            document.body.appendChild(link);

            link.click();

            link.remove();


            URL.revokeObjectURL(url);

        }
    );


/*
========================================
   NEW REGISTRATION
========================================
*/

document
    .getElementById("newRegistration")
    .addEventListener(
        "click",
        () => {

            const confirmed =
                window.confirm(
                    "Mulai pendaftaran baru?"
                );


            if (!confirmed) {
                return;
            }


            try {

                localStorage.removeItem(
                    "ppdbRegistration"
                );

            } catch (error) {
                console.warn(error);
            }


            window.location.reload();

        }
    );


/*
========================================
   TOAST
========================================
*/

function showToast(message) {

    toast.textContent =
        message;

    toast.classList.add("show");


    clearTimeout(
        window.toastTimer
    );


    window.toastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 3000);

}


/*
========================================
   RESTORE DRAFT
========================================
*/

function restoreDraft() {

    /*
    Kita tidak otomatis mengisi
    data pribadi lama demi menjaga
    privasi pengguna.

    localStorage hanya dipakai
    untuk bukti pendaftaran setelah
    submit.
    */

}


/*
========================================
   PREVENT ACCIDENTAL LEAVE
========================================
*/

window.addEventListener(
    "beforeunload",
    event => {

        if (
            form.style.display !== "none" &&
            hasFormData()
        ) {

            event.preventDefault();

            event.returnValue = "";

        }

    }
);


function hasFormData() {

    const inputs =
        form.querySelectorAll(
            "input, select, textarea"
        );


    for (const input of inputs) {

        if (
            input.type !== "file" &&
            input.type !== "checkbox" &&
            input.value.trim()
        ) {

            return true;

        }

    }


    return false;

}