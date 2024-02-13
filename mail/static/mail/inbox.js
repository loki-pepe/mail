let mailboxEmails = null;
let page = 0;
let mb = 'inbox';

document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('log-reg-screen')) {

    // Check focus of input elements in login/register screen
    for (let input of document.getElementsByClassName('log-reg-input')) {
      input.addEventListener('focus', () => {
        input.parentElement.parentElement.className = 'log-reg-field focused';
      });
      input.addEventListener('blur', () => {
        if (input.value.length > 0) {
          input.parentElement.parentElement.className = 'log-reg-field filled';
        } else {
          input.parentElement.parentElement.className = 'log-reg-field';
        }
      });
    }

  } else {

    // Use buttons to toggle between views
    document.getElementById('inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.getElementById('sent').addEventListener('click', () => load_mailbox('sent'));
    document.getElementById('archive').addEventListener('click', () => load_mailbox('archive'));
    document.getElementById('compose').addEventListener('click', () => compose_email());
    document.getElementById('user').addEventListener('click', () => location.reload());

    // By default, load the inbox
    load_mailbox('inbox');

  }
});

function add_email(email) {

  // Create email container
  const emailContainer = document.createElement('div');
  emailContainer.className = 'email-container';
  emailContainer.setAttribute('id', `${email.id}`);
  if (!email.read) {
    emailContainer.setAttribute('unread', '');
  }

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

  // Append sender, subject, and timestamp divs to email div
  emailContainer.append(sender, subject, timestamp);

  // Add click event listener to email div
  emailContainer.addEventListener('click', event => {
    if (event.target.tagName !== 'BUTTON') {
      read_email(email.id);
    }
  });

  if (mb !== 'sent') {
    // Create toggle 'archive' button
    const archiveBtn = toggle_archive(email, emailContainer);

    // Create toggle 'read' button
    const readBtn = toggle_read(email, emailContainer);

    // Create toggle buttons container
    const toggleButtons = document.createElement('div');
    toggleButtons.className = 'toggle-buttons';
    toggleButtons.append(readBtn, archiveBtn);

    // Append email div and 'read' button to email container div
    emailContainer.append(toggleButtons);

    // Add mouse hover event listeners to email container div 
    emailContainer.addEventListener('mouseover', () => {
      toggleButtons.style.display = 'flex';
      timestamp.style.display = 'none';
    });
    emailContainer.addEventListener('mouseout', () => {
      toggleButtons.style.display = 'none';
      timestamp.style.display = 'block';
    });
  }

  // Append email container div to #emails-view
  document.getElementById('mailbox-box').append(emailContainer);
}

function compose_email(recipients='', subject='', body='') {

  // Clear 'active' class from mailbox buttons
  document.getElementById('inbox').className = '';
  document.getElementById('sent').className = '';
  document.getElementById('archive').className = '';


  // Show compose view and hide other views
  document.getElementById('emails-view').style.display = 'none';
  document.getElementById('compose-view').style.display = 'block';
  document.getElementById('read-view').style.display = 'none';

  // Fill/clear out composition fields
  document.getElementById('compose-recipients').value = recipients;
  document.getElementById('compose-subject').value = subject;
  document.getElementById('compose-body').value = body;

  // Use compose form to send email
  document.getElementById('compose-form').onsubmit = send_email;
}

function load_mailbox(mailbox, setPage=0) {

  page = setPage;
  mb = mailbox;

  // Show the mailbox and hide other views
  document.getElementById('emails-view').style.display = 'block';
  document.getElementById('compose-view').style.display = 'none';
  document.getElementById('read-view').style.display = 'none';
  const mailboxContainer = document.getElementById('mailbox-box');
  mailboxContainer.replaceChildren();

  mailboxContainer.addEventListener('scroll', () => {
    if (mailboxContainer.scrollTop > 0) {
      document.getElementById('mailbox-body-title').className = 'scrolled';
    }
    else {
      document.getElementById('mailbox-body-title').className = '';
    }
  });

  // Show the mailbox name
  document.getElementById('mailbox-name').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Set mailbox as active
  document.getElementById('inbox').className = '';
  document.getElementById('sent').className = '';
  document.getElementById('archive').className = '';
  document.getElementById(mailbox).className = 'active';

  // Load mails in mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    // Load emails into global variable
    mailboxEmails = emails;

    // Add emails and pagination to mailbox
    mailbox_page(emails);
  });
}

function mailbox_page(emails) {

  // Clear mailbox
  document.getElementById('mailbox-box').replaceChildren();

  // Mailbox page set-up
  const interval = 50;
  let start = interval*page;
  let end = interval + interval*page;
  let length = emails.length;
  if (end > length) {
    end = length;
  }

  // Load emails into mailbox
  if (emails.length > 0) {
    const slicedEmails = mailboxEmails.slice(start, end);
    for (let email of slicedEmails) {
      add_email(email);
    }
  } else {
    const emptyMailbox = document.createElement('div');
    emptyMailbox.innerHTML = `Your ${mb} folder is empty.`;
    emptyMailbox.className = 'empty';
    document.getElementById('mailbox-box').append(emptyMailbox);
  }


  // Create previous page button and add event listener
  const bckBtn = document.createElement('button');
  bckBtn.className = 'mini-btn';
  document.getElementById('nav-back').replaceChildren(bckBtn);
  document.getElementById('nav-back').append(set_popover(bckBtn, null, 'back'));
  bckBtn.addEventListener('click', () => {
    page--;
    mailbox_page(emails);
  });

  // Create next page button and add event listener
  const fwdBtn = document.createElement('button');
  fwdBtn.className = 'mini-btn';
  document.getElementById('nav-forward').replaceChildren(fwdBtn);
  document.getElementById('nav-forward').append(set_popover(fwdBtn, null, 'forward'));
  fwdBtn.addEventListener('click', () => {
    page++;
    mailbox_page(emails);
  });

  // Load pagination info
  document.getElementById('mailbox-page').innerHTML = `${end > 0 ? start+1 : 0}-${end} of ${length}`;

  // Toggle pagination buttons
  start > 1 ? bckBtn.removeAttribute('disabled') : bckBtn.setAttribute('disabled', '');
  end < length ? fwdBtn.removeAttribute('disabled') : fwdBtn.setAttribute('disabled', '');
}

function not_sent(message) {
  const errorScreen = document.getElementById('error-screen');
  errorScreen.style.display = 'flex';
  document.getElementById('message').innerHTML = message;

  errorScreen.addEventListener('click', event => {
    if (['error-screen', 'popup-btn'].indexOf(event.target.id) !== -1) {
      errorScreen.style.display = 'none';
    }
  })
}

function read_email(id) {

  // Clear out read-email content
  document.getElementById('read-subject').innerHTML = '';
  document.getElementById('read-sender').innerHTML = '';
  document.getElementById('read-recipients').innerHTML = 'to';
  document.getElementById('read-timestamp').innerHTML = '';
  document.getElementById('read-body').innerHTML = '';

  // Mark email as read via PUT
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  });

  const readContainer = document.getElementById('read-box');
  readContainer.addEventListener('scroll', () => {
    if (readContainer.scrollTop > 0) {
      document.getElementById('read-body-title').className = 'scrolled';
    }
    else {
      document.getElementById('read-body-title').className = '';
    }
  });

  setTimeout(() => {

    // Show read view and hide other views
    document.getElementById('emails-view').style.display = 'none';
    document.getElementById('compose-view').style.display = 'none';
    document.getElementById('read-view').style.display = 'block';

    // Get email via GET
    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {

      // Load email info
      document.getElementById('read-subject').innerHTML = email.subject;
      document.getElementById('read-sender').innerHTML = email.sender;
      document.getElementById('read-recipients').innerHTML = 'to&nbsp' + email.recipients.join(', ');
      document.getElementById('read-timestamp').innerHTML = email.timestamp;
      document.getElementById('read-body').innerHTML = email.body;

      // Set up toggle-read and toggle-archive button
      if (mb !== 'sent') {
        document.getElementById('read-button-container').replaceChildren(toggle_read(email));
        document.getElementById('archive-button-container').replaceChildren(toggle_archive(email));
      } else {
        document.getElementById('read-button-container').replaceChildren();
        document.getElementById('archive-button-container').replaceChildren();
      }

      // Set up reply button
      const replyBtn = set_reply_button(email);
      document.getElementById('reply-button-container').replaceChildren(replyBtn);
      document.getElementById('reply-button-container').append(set_popover(replyBtn, null, 'reply'));
    });
  
  }, 75);
}

function remove_email(id, emailContainer){
  document.getElementById('mailbox-box').style.pointerEvents = 'none';
  emailContainer.style.animationPlayState = 'running';
  mailboxEmails = mailboxEmails.filter(email => email.id != id);
  setTimeout(() => {
    mailbox_page(mailboxEmails);
    document.getElementById('mailbox-box').style.pointerEvents = 'auto';
  }, 750);
  
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
    result.message ? load_mailbox('sent') : not_sent(result.error);
  });
  return false;
}

function set_popover(button, email, mode) {
  const popover = document.createElement('div');
  popover.className = 'popover';
  
  let message = document.createElement('div');
  if (mode === 'archive') {
    email.archived ? message.innerHTML = 'Unarchive' : message.innerHTML = 'Archive';
  } else if (mode === 'read') {
    email.read ? message.innerHTML = 'Mark&nbspas&nbspunread' : message.innerHTML = 'Mark&nbspas&nbspread';
  } else if (mode === 'forward') {
    message.innerHTML = 'Older';
  } else if (mode === 'back') {
    message.innerHTML = 'Newer';
  } else if (mode === 'reply') {
    message.innerHTML = 'Reply';
  }
  popover.append(message);

  button.addEventListener('mouseover', () => {
    popover.style.display = 'block';
    popover.style.animationPlayState = 'running';
  });
  button.addEventListener('mouseout', () => popover.style.display = 'none');

  return popover;
}

function set_reply_button(email) {
  const replyButton = document.createElement('button');
  replyButton.className = 'mini-btn';
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

function toggle_archive(email, emailContainer=null) {
  const archiveBtn = document.createElement('button');
  archiveBtn.className = 'mini-btn';

  const popover = set_popover(archiveBtn, email, 'archive');

  const archiveDiv = document.createElement('div');
  email.archived ? archiveDiv.className = 'toggle-unarchive' : archiveDiv.className = 'toggle-archive';
  archiveDiv.className += ' mini-btn-box';
  archiveDiv.append(archiveBtn, popover);

  // Add click event listener to 'archive' button
  archiveBtn.addEventListener('click', () => {
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: !email.archived
      })
    });
    for (let mailboxEmail of mailboxEmails) {
      if (mailboxEmail.id === email.id) {
        mailboxEmail.archived = !email.archived;
      }
    }
    if (emailContainer) {
      remove_email(email.id, emailContainer);
    } else {
      setTimeout(() => load_mailbox('inbox'), 75);
    }
  });

  return archiveDiv;
}

function toggle_read(email, emailContainer=null) {
  const readBtn = document.createElement('button');
  readBtn.className = 'mini-btn';

  const popover = set_popover(readBtn, email, 'read');

  const readDiv = document.createElement('div');
  email.read ? readDiv.className = 'toggle-unread' : readDiv.className = 'toggle-read';
  readDiv.className += ' mini-btn-box';
  readDiv.append(readBtn, popover);

  // Add click event listener to 'read' button
  readBtn.addEventListener('click', () => {
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: !email.read
      })
    });

    for (let mailboxEmail of mailboxEmails) {
      if (mailboxEmail.id === email.id) {
        mailboxEmail.read = !email.read;
      }
    }

    if (emailContainer) {
      emailContainer.toggleAttribute('unread');
      mailbox_page(mailboxEmails);
    } else {
      setTimeout(() => load_mailbox(mb, page), 75);
    }
  });

  return readDiv;
}
