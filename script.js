function bussFetch(ip, path) {
  if (ip.includes('github.com')) ip = ip.replace('github.com','raw.githubusercontent.com')+'/main/'+path;
  return new Promise((resolve, reject) => {
    try {
      fetch(ip)
        .then(res=>res.text())
        .then(res=>resolve(res))
    } catch(err) {
      reject(err);
    }
  })
};

function view() {
  let iframe = document.querySelector('iframe');
  fetch(document.getElementById('dns').value+'/domain/'+document.getElementById('url').value.replace('.','/'))
    .then(async res => {
      res = await res.json();
      let page = await bussFetch(res.ip, 'index.html');
      iframe.reload();
      iframe.contentDocument.write(page);
    })
}