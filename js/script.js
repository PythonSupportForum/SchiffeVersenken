function copyLink() {
    let link = document.getElementById("game-link");
    link.select();
    link.setSelectionRange(0, 99999); /* Für mobile Geräte */
    document.execCommand("copy");
    alert("Link wurde in die Zwischenablage kopiert: " + link.value);
}
function playRandom() {
    /* Code für das Spiel gegen zufälligen Gegner hier */
}