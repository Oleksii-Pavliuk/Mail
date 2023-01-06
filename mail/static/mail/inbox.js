// Popstate event
window.onpopstate = function(event) {
  load_mailbox(event.state.mailbox)
}



document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click',() => compose_email());

  // By default, load the inbox
  load_mailbox('inbox');
});

// Compose email
function compose_email( recipients = '' , subject = '') {

  if (subject.substring(0,3) !== 'Re:' && subject !== ''){
    subject = `Re:${subject}`
  }
  console.log(recipients)
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = recipients ;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = '';

  // API fetch on form submition
  document.querySelector('#compose-form').onsubmit =  () => {
    let recipients = document.querySelector('#compose-recipients').value
    let subject = document.querySelector('#compose-subject').value
    let body = document.querySelector('#compose-body').value
    console.log(body)

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
    });
    load_mailbox('sent')
    return false
  }
}

// Load mailboxes
function load_mailbox(mailbox) {
  // pushing state to history 
  history.pushState({mailbox: mailbox}, "", `emails/${mailbox}`)
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // API call
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        // Print emails
        console.log(emails);

        // Rendering emails
        emails.forEach(email => {
          let container = document.createElement('card')
          container.className = 'card m-4'
          if (email.read){
          container.style.backgroundColor ='lightgray'
          }

          // Creating elements
          let message = document.createElement('div')
          message.className = 'card-body'
          container.appendChild(message)

          let subject = document.createElement('h2')
          subject.className = 'card-title'
          subject.innerHTML = email.subject
          message.appendChild(subject)

          let recipients =  document.createElement('h6')
          recipients.className = 'card-subtitle mb-2 text-muted'
          recipients.innerHTML = ` To ${email.recipients} from ${email.sender}   ${email.timestamp}`
          message.appendChild(recipients)

          // Body of message with reply button which redirects to compose email function
          let body = document.createElement('p')
          body.className = 'card-text'
          body.innerHTML = `${email.body}`
          body.style.display = 'none'
          message.appendChild(body)

          let reply = document.createElement('button')
          reply.className = 'btn btn-info mt-2 mb-2'
          reply.innerHTML = 'Reply'
          reply.style.display = 'block'
          reply.addEventListener('click', () => {
            compose_email(email.sender, email.subject),
            false
          })
          body.appendChild(reply)


          // Read email function
          let read = document.createElement('button')
          read.className = 'card-link btn btn-primary'
          read.innerHTML = 'Read'
          message.appendChild(read)
          read.addEventListener('click', () => {
            let texts = document.querySelectorAll('.card-text')
            texts.forEach(text => {
              text.style.display = 'none'
            })
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  read: true
              })
            })
            container.style.backgroundColor = 'lightgray'
            body.style.display = 'block'
          })

          if(mailbox != 'sent'){
          // Archive or unarchive function 
          let archive = document.createElement('button')
          archive.className = 'card-link btn btn-secondary'
          if (email.archived === false){
            archive.innerHTML = 'Archive'
          }else{
            archive.innerHTML = 'Unarchive'
          }
          message.appendChild(archive)
          archive.addEventListener('click', () => {
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: !email.archived
              })
            })
            container.style.display = 'none'
          })
        }

          document.querySelector('#emails-view').appendChild(container)

        });
  });

}