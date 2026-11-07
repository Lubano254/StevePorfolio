S
/* ========================================
   SETTINGS
   ======================================== */
const FORM_ENDPOINT = "https://formsubmit.co/ajax/vostinjugush@gmail.com";
 
// true when the visitor has asked their device to reduce motion
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
 
/* ========================================
   NAVBAR TOGGLE
   ======================================== */
const menuButton = document.getElementById("menu-icon");
const navbar = document.querySelector(".navbar");
// works whether #menu-icon is the <button> (new) or the <i> itself (older pages)
const menuIcon = menuButton
  ? menuButton.tagName === "I"
    ? menuButton
    : menuButton.querySelector("i")
  : null;
 
function setMenu(open) {
  if (!menuButton || !navbar) return;
 
  navbar.classList.toggle("active", open); // shows/hides navbar
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
 
  if (menuIcon) {
    menuIcon.classList.toggle("fa-bars", !open); // hamburger
    menuIcon.classList.toggle("fa-xmark", open); // X icon
  }
}
 
if (menuButton && navbar) {
  menuButton.addEventListener("click", () => {
    setMenu(!navbar.classList.contains("active"));
  });
 
  // close the menu when a link is clicked (mobile)
  navbar.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });
 
  // close the menu with the Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navbar.classList.contains("active")) {
      setMenu(false);
      menuButton.focus();
    }
  });
}
 
/* ========================================
   SCROLL REVEAL
   (skipped if the library failed to load or motion is reduced)
   ======================================== */
if (typeof ScrollReveal !== "undefined" && !prefersReducedMotion) {
  const sr = ScrollReveal({
    distance: "60px",
    duration: 1000,
    delay: 200,
    // reset: true
  });
 
  sr.reveal(".home-content, .heading", { origin: "top" });
  sr.reveal(".home-img, .resume-container, .contact form", {
    origin: "bottom",
  });
  sr.reveal(".home-content h1, .about-img", { origin: "left" });
  sr.reveal(".home-content p, .about-content", { origin: "right" });
  sr.reveal(".service-card", { origin: "bottom", interval: 150 });
}
 
/* ========================================
   TYPED TEXT
   (only on pages with .multiple-text; otherwise it would throw an
   error and stop everything below, including the contact form)
   ======================================== */
const typedTarget = document.querySelector(".multiple-text");
 
if (typedTarget) {
  const roles = [
    "Digital Marketing Specialist",
    "Content Creator",
    "Blog and Website Manager",
    "Freelancer",
  ];
 
  if (typeof Typed !== "undefined" && !prefersReducedMotion) {
    new Typed(".multiple-text", {
      strings: roles,
      typeSpeed: 100,
      backSpeed: 100,
      backDelay: 1000,
      loop: true,
    });
  } else {
    // no animation: just show the first role as plain text
    typedTarget.textContent = roles[0];
  }
}
 
/* ========================================
   CONTACT FORM
   ======================================== */
const form = document.getElementById("contact-form");
 
// only run on pages that actually have the contact form
if (form) {
  // use our own messages instead of the browser's pop-ups
  form.noValidate = true;
 
  const formSuccess = document.getElementById("form-success");
  const submitBtn = form.querySelector('input[type="submit"]');
 
  // each field: its name, its error element, and a check that returns
  // an error message (or "" when the value is fine)
  const fields = [
    {
      name: "name",
      error: "name-error",
      check: (v) => (v ? "" : "Name is required"),
    },
    {
      name: "email",
      error: "email-error",
      check: (v) => {
        if (!v) return "Email is required";
        return /^\S+@\S+\.\S+$/.test(v) ? "" : "Enter a valid email";
      },
    },
    {
      name: "subject",
      error: "subject-error",
      check: (v) => (v ? "" : "Subject is required"),
    },
    {
      name: "phone",
      error: "phone-error",
      check: (v) => {
        if (!v) return "Phone number is required";
        // digits, spaces, dashes, brackets and an optional leading +
        return /^\+?[\d\s\-()]{7,20}$/.test(v)
          ? ""
          : "Enter a valid phone number";
      },
    },
    {
      name: "message",
      error: "message-error",
      check: (v) => (v ? "" : "Message is required"),
    },
  ];
 
  function showStatus(text, isError) {
    formSuccess.style.color = isError ? "#ff4d6d" : ""; // red, or theme colour
    formSuccess.style.display = "block";
    formSuccess.textContent = text;
  }
 
  form.addEventListener("submit", async function (e) {
    e.preventDefault(); // stop page reload
 
    // reset previous errors and status
    fields.forEach(({ name, error }) => {
      document.getElementById(error).textContent = "";
      form.elements[name].removeAttribute("aria-invalid");
    });
    formSuccess.style.display = "none";
    formSuccess.textContent = "";
 
    // validation checks
    let firstInvalid = null;
 
    fields.forEach(({ name, error, check }) => {
      const input = form.elements[name];
      const message = check(input.value.trim());
 
      if (message) {
        document.getElementById(error).textContent = message;
        input.setAttribute("aria-invalid", "true");
        if (!firstInvalid) firstInvalid = input;
      }
    });
 
    // Stop submission if invalid, and put the cursor on the first problem
    if (firstInvalid) {
      firstInvalid.focus();
      return; // <- THIS prevents blank messages
    }
 
    // spam trap: bots fill the hidden field, people never see it.
    // Pretend it worked, but send nothing.
    const honey = form.elements["_honey"];
    if (honey && honey.value) {
      showStatus("Thank you! Your message has been sent.", false);
      form.reset();
      return;
    }
 
    // everything is valid: send the message by email
    const originalLabel = submitBtn.value;
    submitBtn.disabled = true; // stops double-clicks sending it twice
    submitBtn.value = "Sending...";
 
    try {
      // send the fields as JSON, the format FormSubmit documents for AJAX
      // (this includes the hidden FormSubmit settings from the form)
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const result = await response.json().catch(() => ({}));
 
      if (!response.ok || String(result.success) !== "true") {
        console.error("Contact form failed:", response.status, result);
        throw new Error(result.message || "Sending failed");
      }
 
      showStatus("Thank you! Your message has been sent.", false);
      form.reset();
    } catch (error) {
      console.error("Contact form error:", error);
      showStatus(
        "Sorry, your message could not be sent. Please try again, or email vostinjugush@gmail.com directly.",
        true,
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.value = originalLabel;
    }
  });
}