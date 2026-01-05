
(() => {
  fetch('spirit_types_and_countries.json')
    .then(response => response.json())
    .then(data => {
        const spiritTypes = data.spirit_types;
        const countries = data.countries;

        // Now you can use these data for your filters or any other purpose in your app
        console.log("Spirit Types:", spiritTypes);
        console.log("Countries:", countries);
    })
    .catch(err => console.error("Error loading JSON data:", err));
})();
