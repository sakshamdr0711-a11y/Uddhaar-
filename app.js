/* =========================
   UDDHAR APPLICATION
========================= */


/* =========================
   PAGE NAVIGATION
========================= */

const navButtons = document.querySelectorAll("[data-page]");
const pages = document.querySelectorAll(".page");
const introScreen = document.getElementById("intro");

const pageMap = {
    home: "homePage",
    food: "foodPage",
    sos: "sosPage",
    civic: "civicPage"
};

function showPage(pageName) {
    const targetId = pageMap[pageName];

    if (!targetId) return;

    pages.forEach((page) => {
        page.classList.remove("active");
    });

    const targetPage = document.getElementById(targetId);

    if (targetPage) {
        targetPage.classList.add("active");
    }

    navButtons.forEach((button) => {
        const isActive = button.dataset.page === pageName;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-current", isActive ? "page" : "false");
    });

    document.body.dataset.page = pageName;

    if (claimModal) {
        claimModal.classList.remove("active");
    }

    if (introScreen) {
        introScreen.classList.add("hidden");
    }

    window.scrollTo({
        top: 0,
        behavior: "auto"
    });
}

navButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
        event.preventDefault();
        const nextPage = button.dataset.page;
        if (nextPage) {
            showPage(nextPage);
        }
    });
});

if (introScreen) {
    setTimeout(() => {
        introScreen.classList.add("fade-out");
        setTimeout(() => {
            introScreen.style.display = "none";
            showPage("home");
        }, 700);
    }, 1500);
} else {
    showPage("home");
}

/* =========================
   FOOD RESCUE FORM
========================= */

const foodForm = document.getElementById("foodForm");

if (foodForm) {
    foodForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (
            !validateField(
                document.getElementById("foodName"),
                "Please enter the food name."
            )
        ) return;

        if (
            !validateField(
                document.getElementById("quantity"),
                "Please enter the food quantity."
            )
        ) return;

        if (
            !validateField(
                document.getElementById("location"),
                "Please enter the pickup location."
            )
        ) return;

        if (
            !validateField(
                document.getElementById("expiry"),
                "Please select the expiry time."
            )
        ) return;

        const rescueData = {
            foodName: document.getElementById("foodName").value,
            quantity: document.getElementById("quantity").value,
            foodType: document.getElementById("foodType").value,
            location: document.getElementById("location").value,
            expiry: document.getElementById("expiry").value,
            contact: document.getElementById("contact").value
        };

        console.log("New Food Rescue:", rescueData);
        updateImpact("mealsSaved");
        updateImpact("activeListings");     
        
        
        updateImpact("foodImpact");
        showToast(
            "Rescue Posted",
            "Your food rescue has been added to the active rescue board."
        );

        foodForm.reset();
    });
}

/* =========================
   FOOD RESCUE CARDS
========================= */

/* =========================
   CREATE FOOD RESCUE CARD
========================= */

function createRescueCard(data) {
    const foodList = document.getElementById("foodList");

    if (!foodList) return;


    /* REMOVE EMPTY STATE */

    const emptyState = foodList.querySelector(
        ".empty-rescue-state"
    );

    if (emptyState) {
        emptyState.remove();
    }


    /* CHECK PRIORITY */

    const expiryTime = new Date(data.expiry).getTime();
    const currentTime = Date.now();

    const hoursRemaining =
        (expiryTime - currentTime) / (1000 * 60 * 60);


    let priority = "normal";
    let priorityLabel = "Available";


    if (hoursRemaining <= 2) {
        priority = "high";
        priorityLabel = "High Priority";
    } else if (hoursRemaining <= 6) {
        priority = "soon";
        priorityLabel = "Expiring Soon";
    }


    /* CREATE CARD */

    const rescueCard = document.createElement("article");

    rescueCard.className = `rescue-card ${priority}`;

    rescueCard.dataset.type =
        data.foodType || "other";

    rescueCard.dataset.priority =
        priority;


    rescueCard.innerHTML = `
    <div class="rescue-card-top">

      <div>
        <span class="rescue-status ${priority}">
          ${priorityLabel}
        </span>

        <h3 class="rescue-card-title">
          ${data.foodName || "Food Rescue"}
        </h3>
      </div>

    </div>


    <div class="rescue-details">

      <div class="rescue-detail">
        <i class="fa-solid fa-utensils"></i>
        <span>
          ${data.quantity || "Quantity not specified"}
        </span>
      </div>


      <div class="rescue-detail">
        <i class="fa-solid fa-location-dot"></i>
        <span>
          ${data.location || "Location not specified"}
        </span>
      </div>


      <div class="rescue-detail">
        <i class="fa-regular fa-clock"></i>
        <span>
          Expires: ${data.expiry || "Not specified"}
        </span>
      </div>

    </div>


    <div class="rescue-card-footer">

      <span class="rescue-time">
        Just posted
      </span>

      <button class="claim-rescue">
        Claim Rescue
      </button>

    </div>
  `;


    foodList.prepend(rescueCard);
}


/* =========================
   CLAIM RESCUE MODAL
========================= */

const claimModal =
    document.getElementById("claimModal");

const closeModal =
    document.getElementById("closeModal");

const claimForm =
    document.getElementById("claimForm");

if (!claimModal || !closeModal || !claimForm) {
    console.info("Rescue request modal is disabled for this page.");
}

let selectedRescue = null;


/* OPEN CLAIM MODAL */

document.addEventListener("click", (event) => {

    const claimButton =
        event.target.closest(".claim-rescue");

    if (!claimButton) return;

    if (document.body.dataset.page !== "food") {
        return;
    }


    /* FIND SELECTED CARD */

    selectedRescue =
        claimButton.closest(".rescue-card");


    /* GET FOOD NAME */

    const rescueTitle =
        selectedRescue?.querySelector(
            ".rescue-card-title"
        )?.textContent.trim();


    console.log(
        "Selected rescue:",
        rescueTitle
    );


    /* OPEN MODAL */

    if (claimModal) {
        claimModal.classList.add("active");
    }

});


/* CLOSE MODAL */

if (closeModal) {

    closeModal.addEventListener(
        "click",
        () => {

            claimModal.classList.remove("active");

            selectedRescue = null;

        }
    );

}


/* CLOSE WHEN CLICKING OUTSIDE */

if (claimModal) {

    claimModal.addEventListener(
        "click",
        (event) => {

            if (event.target === claimModal) {

                claimModal.classList.remove("active");

                selectedRescue = null;

            }

        }
    );

}


/* SUBMIT CLAIM */

if (claimForm) {

    claimForm.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            const rescueTitle =
                selectedRescue?.querySelector(
                    ".rescue-card-title"
                )?.textContent.trim()
                || "this rescue";


            console.log(
                "Claim submitted for:",
                rescueTitle
            );

            updateImpact("claimedListings");
            showToast(
                "Claim Request Sent",
                `Your request to claim ${rescueTitle} has been submitted.`
            );


            claimForm.reset();

            claimModal.classList.remove("active");

            selectedRescue = null;

        }
    );

}

/* =========================
   FOOD RESCUE FILTERS
========================= */

const filterButtons =
    document.querySelectorAll(".filter-btn");


filterButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const filterText =
            button.textContent.trim();


        /* UPDATE ACTIVE BUTTON */

        filterButtons.forEach((btn) => {
            btn.classList.remove("active");
        });

        button.classList.add("active");


        /* GET ALL RESCUE CARDS */

        const rescueCards =
            document.querySelectorAll(".rescue-card");


        rescueCards.forEach((card) => {

            const priority =
                card.dataset.priority;


            /* SHOW ALL */

            if (filterText.includes("All")) {

                card.style.display = "flex";

            }


            /* HIGH PRIORITY */

            else if (
                filterText.includes("High Priority")
            ) {

                card.style.display =
                    priority === "high"
                        ? "flex"
                        : "none";

            }


            /* EXPIRING SOON */

            else if (
                filterText.includes("Expiring Soon")
            ) {

                card.style.display =
                    priority === "soon"
                        ? "flex"
                        : "none";

            }

        });

    });

});

/* =========================
   IMPACT COUNTER ANIMATION
========================= */

function animateCounter(element) {
    const target = Number(element.dataset.target);

    if (!target) return;

    let current = 0;

    const increment = Math.ceil(target / 80);

    const counter = setInterval(() => {
        current += increment;

        if (current >= target) {
            current = target;
            clearInterval(counter);
        }

        element.textContent = current;
    }, 20);
}


/* START COUNTERS */

const impactCounters =
    document.querySelectorAll("[data-target]");

impactCounters.forEach((counter) => {
    animateCounter(counter);
});

/* =========================
   SOS FUNCTIONALITY
========================= */

const sosTrigger = document.getElementById("sosTrigger");
const sosForm = document.getElementById("sosForm");


/* ACTIVATE SOS */

if (sosTrigger) {

    sosTrigger.addEventListener("click", () => {

        /* VISUAL ALERT STATE */

        sosTrigger.classList.add("activated");

        sosTrigger.innerHTML = `
      <i class="fa-solid fa-triangle-exclamation"></i>
      <span>ALERT MODE ACTIVE</span>
    `;


        /* SCROLL TO EMERGENCY FORM */

        const sosDetails =
            document.querySelector(".sos-details");

        if (sosDetails) {

            sosDetails.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            setTimeout(() => {

                const emergencyType =
                    document.getElementById("emergencyType");

                if (emergencyType) {
                    emergencyType.focus();
                }

            }, 700);

        }

    });

}


/* SUBMIT SOS REPORT */

if (sosForm) {

    sosForm.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();
            if (
                !validateField(
                    document.getElementById("emergencyType"),
                    "Please select the emergency type."
                )
            ) return;

            if (
                !validateField(
                    document.getElementById("sosLocation"),
                    "Please provide the emergency location."
                )
            ) return;

            if (
                !validateField(
                    document.getElementById("sosDescription"),
                    "Please describe the emergency."
                )
            ) return;


            const sosData = {

                emergencyType:
                    document.getElementById(
                        "emergencyType"
                    ).value,

                location:
                    document.getElementById(
                        "sosLocation"
                    ).value,

                description:
                    document.getElementById(
                        "sosDescription"
                    ).value,

                peopleAffected:
                    document.getElementById(
                        "peopleAffected"
                    ).value || "Not specified"

            };


            console.log(
                "Emergency SOS Report:",
                sosData
            );

            updateImpact("emergencyImpact");
            showToast(
                "Emergency Report Sent",
                "Your report has been recorded for response coordination."
            );


            sosForm.reset();


            /* RESET SOS BUTTON */

            if (sosTrigger) {

                sosTrigger.classList.remove(
                    "activated"
                );

                sosTrigger.innerHTML = `
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>ACTIVATE SOS</span>
        `;

            }

        }
    );

}
/* =========================
   TOAST NOTIFICATIONS
========================= */

const toastContainer =
    document.getElementById("toastContainer");


function showToast(
    title,
    message,
    type = "success"
) {
    if (!toastContainer) return;

    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;


    const icon =
        type === "error"
            ? "fa-circle-exclamation"
            : "fa-circle-check";


    toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>

    <div class="toast-content">
      <h4>${title}</h4>
      <p>${message}</p>
    </div>
  `;


    toastContainer.appendChild(toast);


    /* REMOVE TOAST */

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform =
            "translateX(30px)";

        setTimeout(() => {
            toast.remove();
        }, 300);

    }, 4000);
}

/* =========================
   CIVIC REPORT FUNCTIONALITY
========================= */

const civicForm = document.getElementById("civicForm");
const civicReportBoard =
    document.getElementById("civicReportBoard");

const civicEmptyState =
    document.getElementById("civicEmptyState");


if (civicForm) {

    civicForm.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();
            if (
                !validateField(
                    document.getElementById("civicIssue"),
                    "Please select or enter the civic issue."
                )
            ) return;

            if (
                !validateField(
                    document.getElementById("civicLocation"),
                    "Please provide the issue location."
                )
            ) return;

            if (
                !validateField(
                    document.getElementById("civicDescription"),
                    "Please describe the issue."
                )
            ) return;


            const civicData = {

                issue:
                    document.getElementById(
                        "civicIssue"
                    ).value,

                location:
                    document.getElementById(
                        "civicLocation"
                    ).value,

                description:
                    document.getElementById(
                        "civicDescription"
                    ).value,

                impact:
                    document.getElementById(
                        "civicImpact"
                    ).value

            };


            console.log(
                "New Civic Report:",
                civicData
            );


            /* REMOVE EMPTY STATE */

            if (civicEmptyState) {
                civicEmptyState.remove();
            }


            /* CREATE REPORT CARD */

            if (civicReportBoard) {

                const reportCard =
                    document.createElement("article");

                reportCard.className =
                    "civic-report-card";


                reportCard.innerHTML = `

          <div class="civic-report-top">

            <span class="civic-impact ${civicData.impact}">
              ${civicData.impact}
            </span>

            <span class="civic-report-time">
              Just reported
            </span>

          </div>


          <h3>
            ${civicData.issue}
          </h3>


          <p class="civic-report-location">
            <i class="fa-solid fa-location-dot"></i>
            ${civicData.location}
          </p>


          <p class="civic-report-description">
            ${civicData.description}
          </p>


          <button class="support-report">
            <i class="fa-solid fa-handshake"></i>
            Support Response
          </button>

        `;


                civicReportBoard.prepend(
                    reportCard
                );

            }

            updateImpact("civicImpactStat");
            showToast(
                "Civic Report Submitted",
                "Your report has been added to the community response board."
            );


            civicForm.reset();

        }
    );

}

/* =========================
   CIVIC RESPONSE SUPPORT
========================= */

document.addEventListener("click", (event) => {

    const supportButton =
        event.target.closest(".support-report");

    if (!supportButton) return;


    const reportCard =
        supportButton.closest(".civic-report-card");

    const issueTitle =
        reportCard?.querySelector("h3")
            ?.textContent.trim()
        || "this civic issue";


    /* PREVENT DOUBLE SUPPORT */

    if (
        supportButton.classList.contains(
            "supported"
        )
    ) {

        showToast(
            "Already Supporting",
            `You are already supporting ${issueTitle}.`
        );

        return;

    }


    /* MARK AS SUPPORTED */

    supportButton.classList.add(
        "supported"
    );

    supportButton.innerHTML = `
    <i class="fa-solid fa-check"></i>
    Response Support Added
  `;


    supportButton.disabled = true;


    showToast(
        "Response Support Added",
        `You are now part of the response for ${issueTitle}.`
    );

});

/* =========================
   IMPACT DASHBOARD UPDATES
========================= */

function updateImpact(statId, amount = 1) {

    const stat = document.getElementById(statId);

    if (!stat) return;

    const currentValue =
        Number(stat.dataset.target || 0);

    const newValue =
        currentValue + amount;

    stat.dataset.target = newValue;

    stat.textContent = newValue;
}