
const navButtons = document.querySelectorAll("[data-page]");
const pages = document.querySelectorAll(".page");
const introScreen = document.getElementById("intro");
const dock = document.querySelector(".dock");
const dockToggle = document.querySelector(".dock-toggle");

const pageMap = {
    home: "homePage",
    food: "foodPage",
    sos: "sosPage",
    civic: "civicPage"
};

function validateField(input, message) {
    if (!input) {
        if (message) {
            console.warn(message);
        }
        return false;
    }

    const value = input.value?.trim?.() ?? "";

    if (!value) {
        if (message) {
            showToast("Required", message, "error");
        }
        input.focus();
        return false;
    }

    return true;
}

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

            /* Close navigation after page selection */
            if (dock) {
                dock.classList.remove("expanded");
            }

            if (dockToggle) {
                dockToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        }
    });
});



if (dock && dockToggle) {

    dockToggle.addEventListener("click", () => {

        const isExpanded =
            dock.classList.toggle("expanded");

        dockToggle.setAttribute(
            "aria-expanded",
            isExpanded
        );

    });

}

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

const API_URL = "http://127.0.0.1:5000";


const foodForm = document.getElementById("foodForm");


if (foodForm) {

    foodForm.addEventListener(
        "submit",
        async (event) => {

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

                foodName:
                    document.getElementById("foodName").value,

                quantity:
                    document.getElementById("quantity").value,

                foodType:
                    document.getElementById("foodType").value,

                location:
                    document.getElementById("location").value,

                expiry:
                    document.getElementById("expiry").value,

                contact:
                    document.getElementById("contact").value
            };


            try {

                const response = await fetch(
                    `${API_URL}/food-rescues`,
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(rescueData)

                    }
                );


                const result =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        "Failed to create rescue"
                    );

                }


                console.log(
                    "Food Rescue Saved:",
                    result
                );


                createRescueCard(
                    result.rescue
                );

                async function loadFoodRescues() {

                    const foodList =
                        document.getElementById("foodList");


                    if (!foodList) return;


                    try {

                        const response = await fetch(
                            `${API_URL}/food-rescues`
                        );


                        const result =
                            await response.json();


                        if (!response.ok) {

                            throw new Error(
                                "Could not load food rescues"
                            );

                        }


                        // Clear current content

                        foodList.innerHTML = "";


                        if (
                            !result.rescues ||
                            result.rescues.length === 0
                        ) {

                            foodList.innerHTML = `

                <div class="empty-rescue-state">

                    <i class="fa-solid fa-box-open"></i>

                    <h3>No active rescues yet</h3>

                    <p>
                        Be the first to create a food rescue
                        and prevent good food from going to waste.
                    </p>

                </div>

            `;

                            return;

                        }


                        // Render database rescues

                        result.rescues.forEach(
                            (rescue) => {

                                createRescueCard(rescue);

                            }
                        );


                        console.log(
                            "Loaded Food Rescues:",
                            result.count
                        );


                    } catch (error) {

                        console.warn(
                            "Could not load food rescues:",
                            error
                        );

                    }

                }


                updateImpact("mealsSaved");

                updateImpact("activeListings");


                showToast(
                    "Rescue Posted",
                    `Your ${result.rescue.priority.toUpperCase()} priority rescue has been added.`
                );


                foodForm.reset();


            } catch (error) {

                console.error(
                    "Food Rescue Error:",
                    error
                );


                showToast(
                    "Connection Error",
                    error.message ||
                    "Unable to connect to the UDDHAAR backend."
                );

            }

        }
    );

}


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


    const priority = data.priority || "low";

    let priorityLabel = "Available";

    if (priority === "critical") {
        priorityLabel = "Critical";
    }
    else if (priority === "high") {
        priorityLabel = "High Priority";
    }
    else if (priority === "medium") {
        priorityLabel = "Expiring Soon";
    }


    /* CREATE CARD */

    const rescueCard = document.createElement("article");

    rescueCard.className = `rescue-card ${priority}`;

    /* Database ID — needed to claim this rescue */
    rescueCard.dataset.id = data.id || "";

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
        async (event) => {

            event.preventDefault();


            if (!selectedRescue) {

                showToast(
                    "Error",
                    "No rescue selected.",
                    "error"
                );

                return;

            }


            const rescueId =
                selectedRescue.dataset.id;


            const rescueTitle =
                selectedRescue
                    .querySelector(
                        ".rescue-card-title"
                    )
                    ?.textContent
                    .trim()
                || "this rescue";


            /* Safety check */

            if (!rescueId) {

                showToast(
                    "Error",
                    "This rescue is not connected to the database yet.",
                    "error"
                );

                return;

            }


            try {

                const response = await fetch(
                    `${API_URL}/food-rescues/${rescueId}/claim`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        }
                    }
                );


                const result =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        "Unable to claim rescue"
                    );

                }


                console.log(
                    "Rescue claimed:",
                    result
                );


                /* Update impact */

                updateImpact(
                    "claimedListings"
                );


                /* Remove card from board */

                selectedRescue.remove();


                /* Show empty state if needed */

                const foodList =
                    document.getElementById(
                        "foodList"
                    );


                if (
                    foodList &&
                    foodList.querySelectorAll(
                        ".rescue-card"
                    ).length === 0
                ) {

                    foodList.innerHTML = `
                    
                        <div class="empty-rescue-state">

                            <i class="fa-solid fa-box-open"></i>

                            <h3>
                                No active rescues yet
                            </h3>

                            <p>
                                Be the first to create a food rescue
                                and prevent good food from going to waste.
                            </p>

                        </div>
                    
                    `;

                }


                showToast(
                    "Rescue Claimed",
                    `${rescueTitle} has been successfully claimed.`
                );


                claimForm.reset();

                claimModal.classList.remove(
                    "active"
                );

                selectedRescue = null;


            } catch (error) {

                console.error(
                    "Claim Error:",
                    error
                );


                showToast(
                    "Claim Failed",
                    error.message ||
                    "Unable to connect to the UDDHAAR backend.",
                    "error"
                );

            }

        }
    );

}


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

    sosForm.addEventListener("submit", async (event) => {

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
            emergencyType: document.getElementById("emergencyType").value,
            location: document.getElementById("sosLocation").value,
            description: document.getElementById("sosDescription").value,
            peopleAffected: document.getElementById("peopleAffected").value || "Not specified"
        };

        try {
            const response = await fetch(
                "http://127.0.0.1:5000/analyze-priority",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        type: "emergency",
                        emergencyType: sosData.emergencyType,
                        peopleAffected: sosData.peopleAffected
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const analysis = await response.json();
            sosData.priority = analysis.priority;
            sosData.score = analysis.score;
            console.log("UDDHAR SOS Analysis:", analysis);
        } catch (error) {
            console.warn("SOS backend unavailable. Continuing in demo mode.", error);
            sosData.priority = "high";
            sosData.score = 0;
        }

        console.log("Emergency SOS Report:", sosData);

        updateImpact("emergencyImpact");
        showToast(
            "Emergency Report Sent",
            "Your report has been recorded for response coordination."
        );

        sosForm.reset();

        if (sosTrigger) {
            sosTrigger.classList.remove("activated");
            sosTrigger.innerHTML = `
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>ACTIVATE SOS</span>
        `;
        }
    });
}

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


const demoChat = document.getElementById("demoChat");
const demoChatTrigger = document.getElementById("demoChatTrigger");
const demoChatClose = document.getElementById("demoChatClose");
const demoChatForm = document.getElementById("demoChatForm");
const demoChatInput = document.getElementById("demoChatInput");
const demoChatBody = document.getElementById("demoChatBody");
const demoChatChips = document.querySelectorAll(".demo-chip");

function appendDemoMessage(text, sender = "bot") {
    if (!demoChatBody) return;

    const wrapper = document.createElement("div");
    wrapper.className = `demo-message ${sender}`;

    const bubble = document.createElement("p");
    bubble.textContent = text;
    wrapper.appendChild(bubble);
    demoChatBody.appendChild(wrapper);
    demoChatBody.scrollTop = demoChatBody.scrollHeight;
}

function generateDemoReply(message) {
    const text = message.toLowerCase();

    if (/food|rescue|meal|donation/.test(text)) {
        return "Food rescue demo: 18 meals detected, 2 pickups scheduled, and a volunteer is en route to the nearest community partner.";
    }

    if (/sos|emergency|urgent|alert/.test(text)) {
        return "SOS demo: high-priority emergency routing engaged. Location, impact, and responder queue have been staged for rapid coordination.";
    }

    if (/civic|issue|road|water|waste|repair/.test(text)) {
        return "Civic issue demo: the report has been classified as a community priority and routed to the relevant local response channel.";
    }

    if (/hello|hi|hey/.test(text)) {
        return "Welcome to the UDDHAAR demo. Ask for Food rescue, SOS, or Civic issue to preview each flow.";
    }

    return "Demo response: I’ve mapped this to the community response flow and prepared a sample escalation for the mock dashboard.";
}

if (demoChatTrigger) {
    demoChatTrigger.addEventListener("click", () => {
        if (!demoChat) return;
        demoChat.classList.toggle("open");
        const isOpen = demoChat.classList.contains("open");
        demoChatTrigger.setAttribute("aria-expanded", String(isOpen));

        if (isOpen && demoChatInput) {
            demoChatInput.focus();
        }
    });
}

if (demoChatClose) {
    demoChatClose.addEventListener("click", () => {
        if (demoChat) {
            demoChat.classList.remove("open");
        }
    });
}

if (demoChatChips) {
    demoChatChips.forEach((chip) => {
        chip.addEventListener("click", () => {
            const value = chip.dataset.message || chip.textContent.trim();
            if (value && demoChatInput) {
                demoChatInput.value = value;
                demoChatForm?.requestSubmit?.();
            }
        });
    });
}

if (demoChatForm) {
    demoChatForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!demoChatInput) return;

        const value = demoChatInput.value.trim();
        if (!value) return;

        appendDemoMessage(value, "user");
        appendDemoMessage(generateDemoReply(value), "bot");
        demoChatInput.value = "";
        demoChatInput.focus();
    });
}

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


// ==========================================
// LOAD LIVE IMPACT DASHBOARD
// ==========================================

async function loadDashboard() {

    try {

        const response = await fetch(
            `${API_URL}/dashboard`
        );

        const result = await response.json();


        if (!response.ok) {

            throw new Error(
                "Unable to load dashboard"
            );

        }


        const data = result.dashboard;


        document.getElementById(
            "mealsSaved"
        ).textContent =
            data.mealsSaved;


        document.getElementById(
            "claimedListings"
        ).textContent =
            data.claimedListings;


        document.getElementById(
            "activeListings"
        ).textContent =
            data.activeListings;


        console.log(
            "Live dashboard loaded:",
            data
        );


    } catch (error) {

        console.warn(
            "Dashboard loading error:",
            error
        );

    }

}



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

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadFoodRescues();

        loadDashboard();

    }
);