var query = new URLSearchParams(window.location.href);
if (query.get('--err')) {
    var alertEl = document.createElement('div');
    alertEl.setAttribute('class', 'alert alert-danger');
    alertEl.innerText = query.get('--err');

}
if (query.get('--msg')) {
    var alertEl = document.createElement('div');
    alertEl.setAttribute('class', 'alert alert-success');
    alertEl.innerText = query.get('--msg');
}

if (typeof alertEl !== 'undefined') {
    document.getElementById('alerts-container').appendChild(alertEl);
}