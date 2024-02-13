document.addEventListener('DOMContentLoaded', function() {
    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', () => compose_email());
  
    // By default, load the inbox
    load_mailbox('inbox');
  });
  
  function add_email(email) {
  
    // Create email container div
    const emailContainer = document.createElement('div')
    emailContainer.className = 'email-container';
    emailContainer.setAttribute('id', `${email.id}`)
    if (!email.read) {
      emailContainer.setAttribute('unread', '');
    }
  
    // Create email div
    const emailElement = document.createElement('div');
    emailElement.className = 'email-element';
  
    // Create sender div
    const sender = document.createElement('div');
    sender.innerHTML = email.sender;
    sender.className = 'sender';
  
    // Create subject div
    const subject = document.createElement('div');
    subject.innerHTML = email.subject;
    subject.className = 'subject';
  
    // Create timestamp div
    const timestamp = document.createElement('div');
    timestamp.innerHTML = email.timestamp;
    timestamp.className = 'timestamp';
  
    // Create toggle 'read' button
    const readBtn = read_button(email, emailContainer);
  
    // Append sender, subject, and timestamp divs to email div
    emailElement.append(sender, subject, timestamp);
  
    // Add click event listener to email div
    emailElement.addEventListener('click', () => read_email(email.id));
  
    // Append email div and 'read' button to email container div
    emailContainer.append(emailElement, readBtn);
  
    // Add mouse hover event listeners to email container div 
    emailContainer.addEventListener('mouseover', () => {
      readBtn.style.display = 'block';
      timestamp.innerHTML = email.timestamp.slice(0, 11);
    });
    emailContainer.addEventListener('mouseout', () => {
      readBtn.style.display = 'none';
      timestamp.innerHTML = email.timestamp;
    });
  
    // Append email container div to #emails-view
    document.getElementById('mailbox-box').append(emailContainer);
  }
  
  function compose_email(recipients='', subject='', body='') {
  
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#read-view').style.display = 'none';
  
    // Fill/clear out composition fields
    document.querySelector('#compose-recipients').value = recipients;
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = body;
  
    // Use compose form to send email
    document.querySelector('#compose-form').onsubmit = send_email;
  }
  
  function load_mailbox(mailbox, page=0) {
  
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#read-view').style.display = 'none';
    document.getElementById('mailbox-box').replaceChildren();
  
    // Show the mailbox name
    document.querySelector('#mailbox-name').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
    // Load mails in mailbox
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
  
      // Mailbox page set-up
      const interval = 50;
      let start = interval*page;
      let end = interval + interval*page;
      let length = emails.length;
      if (end > length) {
        end = length;
      }
  
      // Add pagination to mailbox
      pagination(start, end, length, mailbox, page);
  
      // Load emails into mailbox
      const slicedEmails = emails.slice(start, end);
      for (let email of slicedEmails) {
        add_email(email);
      }
    });
  }
  
  function pagination(start, end, length, mailbox, page=0) {
  
    // Create previous page button and add event listener
    const bckBtn = document.createElement('button');
    bckBtn.innerHTML = '&lt;';
    document.querySelector('#nav-back').replaceChildren(bckBtn);
    bckBtn.addEventListener('click', () => {
      page--;
      load_mailbox(mailbox, page);
    });
  
    // Create next page button and add event listener
    const fwdBtn = document.createElement('button');
    fwdBtn.innerHTML = '&gt;';
    document.querySelector('#nav-forward').replaceChildren(fwdBtn);
    fwdBtn.addEventListener('click', () => {
      page++;
      load_mailbox(mailbox, page);
    });
  
    // Load pagination info
    document.getElementById('mailbox-page').innerHTML = `${start+1}-${end} of ${length}`;
  
    // Toggle pagination buttons
    start > 1 ? bckBtn.removeAttribute('disabled') : bckBtn.setAttribute('disabled', '');
    end < length ? fwdBtn.removeAttribute('disabled') : fwdBtn.setAttribute('disabled', '');
  }
  
  function read_button(email, emailContainer=null) {
    const readBtn = document.createElement('button');
    readBtn.style.display = 'none';
    readBtn.innerHTML = 'Read';
    readBtn.className = 'toggle-read';
  
    // Add click event listener to 'read' button
    readBtn.addEventListener('click', () => {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: !email.read
        })
      });
      emailContainer.toggleAttribute('unread')
      for (let localEmail of localEmails) {
        if (localEmail.id === email.id) {
          localEmail.read = !email.read;
        }
      }
    });


    return readBtn;
  }
  
  function read_email(id) {
  
    // Show read view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#read-view').style.display = 'block';
  
    // Get email via GET
    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
  
      // Load email info
      document.getElementById('read-subject').innerHTML = email.subject;
      document.getElementById('read-sender').innerHTML = email.sender;
      document.getElementById('read-recipients').innerHTML = email.recipients.join(', ')
      document.getElementById('read-timestamp').innerHTML = email.timestamp;
      document.getElementById('read-body').innerHTML = email.body;
  
      // Set up archive button
      if (email.recipients.includes(document.getElementById('user').innerHTML)) {
        document.getElementById('archive-button-container').replaceChildren(set_archive_button(email));
      } else {
        document.getElementById('archive-button-container').replaceChildren();
      }
  
      // Set up reply button
      document.getElementById('reply-button-container').replaceChildren(set_reply_button(email));
    });
  
    // Mark email as read via PUT
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    });
  }
  
  function send_email() {
  
    // Try to send email via POST
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.getElementById('compose-recipients').value,
        subject: document.getElementById('compose-subject').value,
        body: document.getElementById('compose-body').value,
      })
    })
    .then(response => response.json())
    .then(result => {
  
      // If mail is sent successfully load sent mailbox, else alert the user
      result.message ? load_mailbox('sent') : alert(result.error);
    });
    return false;
  }
  
  function set_archive_button(email) {
    const archiveButton = document.createElement('button');
    email.archived ? archiveButton.innerHTML = 'Unarchive' : archiveButton.innerHTML = 'Archive';
    archiveButton.addEventListener('click', () => {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: !email.archived
        })
      })
      load_mailbox('inbox');
    })
    return archiveButton;
  }
  
  function set_reply_button(email) {
    const replyButton = document.createElement('button');
    replyButton.innerHTML = 'Reply';
    replyButton.addEventListener('click', () => {
      let subject = email.subject;
      if (!email.subject.startsWith('Re: ')) {
        subject = 'Re: '.concat(subject);
      }
      let body = `On ${email.timestamp} ${email.sender} wrote:\n\n` + email.body + '\n_________\n\n';
      compose_email(email.sender, subject, body);
    });
    return replyButton;
  }