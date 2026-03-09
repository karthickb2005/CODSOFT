const GEMINI_API_KEY = "AIzaSyCcDwoHB4MPlkkw1TXU7UqCNEMEdSuaBkw";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;

fetch(url)
    .then(res => res.json())
    .then(data => {
        if (data.models) {
            console.log("AVAILABLE MODELS:", data.models.map(m => m.name).join(", "));
        } else {
            console.log("ERROR:", data);
        }
    })
    .catch(err => console.error(err));
