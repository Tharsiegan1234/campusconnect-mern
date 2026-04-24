fetch('http://localhost:5000/api/skills/enroll/69ce64198ae5ade5798d2e3b', {
    method: 'POST'
})
.then(r => r.json().then(b => console.log('HTTP', r.status, b)))
.catch(console.error);
