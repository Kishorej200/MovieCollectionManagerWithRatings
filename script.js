let movies = JSON.parse(localStorage.getItem('movies')) || [];
let currentRating = 0, editRating = 0, editingMovieId = null, currentFilter = 'All';

const stars = document.querySelectorAll('#ratingInput .star');
const editStars = document.querySelectorAll('#editRatingInput .edit-star');

// Star click handlers
stars.forEach(star => star.addEventListener('click', () => {
    currentRating = parseInt(star.dataset.rating);
    updateStars(stars, currentRating);
    document.getElementById('ratingText').textContent = currentRating + '/5';
}));
editStars.forEach(star => star.addEventListener('click', () => {
    editRating = parseInt(star.dataset.rating);
    updateStars(editStars, editRating);
    document.getElementById('editRatingText').textContent = editRating + '/5';
}));

function updateStars(starElements, rating){
    starElements.forEach(star => star.classList.toggle('active', parseInt(star.dataset.rating) <= rating));
}

function saveToLocal(){ localStorage.setItem('movies', JSON.stringify(movies)); }

function addMovie(){
    const title = document.getElementById('movieTitle').value.trim();
    const director = document.getElementById('director').value.trim();
    const year = document.getElementById('year').value;
    const genre = document.getElementById('genre').value;
    const description = document.getElementById('description').value.trim();
    const watched = document.getElementById('watched').checked;
    if(!title){ alert('Enter title'); return; }
    if(currentRating===0){ alert('Select rating'); return; }
    const movie = { id: Date.now(), title, director, year, genre, rating: currentRating, description, watched };
    movies.push(movie);
    saveToLocal();
    clearForm();
    updateDashboard();
}

function clearForm(){
    ['movieTitle','director','year','description'].forEach(id => document.getElementById(id).value='');
    document.getElementById('watched').checked=false;
    currentRating=0; updateStars(stars,0);
    document.getElementById('ratingText').textContent='0/5';
}

function displayMovies(){
    const grid = document.getElementById('moviesGrid');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    let filtered = movies;
    if(currentFilter==='Watched') filtered = movies.filter(m=>m.watched);
    else if(currentFilter!=='All') filtered = movies.filter(m=>m.genre===currentFilter);
    if(searchTerm) filtered = filtered.filter(m=> m.title.toLowerCase().includes(searchTerm) || m.director.toLowerCase().includes(searchTerm) || m.description.toLowerCase().includes(searchTerm));
    if(!filtered.length){ grid.innerHTML='<p>No movies found</p>'; return; }
    grid.innerHTML = filtered.map(m=>`
        <div class="movie-card">
            <h3>${m.title} ${m.watched?'✓':''}</h3>
            <p>Director: ${m.director||'-'}</p>
            <p>Year: ${m.year||'-'}</p>
            <p>Genre: ${m.genre}</p>
            <p class="rating">${'★'.repeat(m.rating)+'☆'.repeat(5-m.rating)}</p>
            <p>${m.description||'-'}</p>
            <button onclick="openEditModal(${m.id})">Edit</button>
            <button onclick="deleteMovie(${m.id})">Delete</button>
        </div>`).join('');
}

function deleteMovie(id){
    if(!confirm('Delete this movie?')) return;
    movies = movies.filter(m=>m.id!==id);
    saveToLocal();
    updateDashboard();
}

function filterByGenre(genre,event){
    currentFilter=genre;
    document.querySelectorAll('.filter-btn').forEach(btn=>btn.classList.remove('active'));
    event.target.classList.add('active');
    displayMovies();
}

function openEditModal(id){
    const movie = movies.find(m=>m.id===id); if(!movie) return;
    editingMovieId=id;
    ['Title','Director','Year','Description'].forEach(idSuffix => document.getElementById('edit'+idSuffix).value = movie[idSuffix.toLowerCase()]);
    document.getElementById('editGenre').value=movie.genre;
    document.getElementById('editWatched').checked=movie.watched;
    editRating=movie.rating; updateStars(editStars,editRating);
    document.getElementById('editRatingText').textContent=editRating+'/5';
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal(){ document.getElementById('editModal').classList.remove('active'); editingMovieId=null; }

function saveEdit(){
    const movie=movies.find(m=>m.id===editingMovieId); if(!movie) return;
    movie.title=document.getElementById('editTitle').value.trim();
    movie.director=document.getElementById('editDirector').value.trim();
    movie.year=document.getElementById('editYear').value;
    movie.genre=document.getElementById('editGenre').value;
    movie.rating=editRating;
    movie.description=document.getElementById('editDescription').value.trim();
    movie.watched=document.getElementById('editWatched').checked;
    saveToLocal(); closeEditModal(); updateDashboard();
}

function updateDashboard(){
    document.getElementById('totalMovies').textContent=movies.length;
    const avg=movies.length?(movies.reduce((a,b)=>a+b.rating,0)/movies.length).toFixed(1):0;
    document.getElementById('avgRating').textContent=avg;
    document.getElementById('watchedCount').textContent=movies.filter(m=>m.watched).length;
    const genreCounts={}; movies.forEach(m=>genreCounts[m.genre]=(genreCounts[m.genre]||0)+1);
    document.getElementById('favoriteGenre').textContent=movies.length?Object.keys(genreCounts).reduce((a,b)=>genreCounts[a]>genreCounts[b]?a:b):'-';
    displayMovies(); updateCharts();
}

// Charts
let genreChart,ratingChart;
function updateCharts(){
    const ctx1=document.getElementById('genreChart').getContext('2d');
    if(genreChart) genreChart.destroy();
    const genreCounts={}; movies.forEach(m=>genreCounts[m.genre]=(genreCounts[m.genre]||0)+1);
    genreChart=new Chart(ctx1,{type:'bar',data:{labels:Object.keys(genreCounts),datasets:[{label:'Movies',data:Object.values(genreCounts),backgroundColor:'#667eea'}]},options:{responsive:true,scales:{y:{beginAtZero:true}}}});

    const ctx2=document.getElementById('ratingChart').getContext('2d');
    if(ratingChart) ratingChart.destroy();
    const ratingCounts={1:0,2:0,3:0,4:0,5:0}; movies.forEach(m=>ratingCounts[m.rating]++);
    ratingChart=new Chart(ctx2,{type:'doughnut',data:{labels:['1','2','3','4','5'],datasets:[{data:Object.values(ratingCounts),backgroundColor:['#f93','pink','#ffce56','#4facfe','#43e97b']}]},options:{responsive:true,plugins:{legend:{position:'bottom'}}}});
}

// Load sample data if empty
if(!movies.length){
    const samples=[
        {title:'The Shawshank Redemption', director:'Frank Darabont', year:'1994', genre:'Drama', rating:5, description:'Hope and friendship behind bars.', watched:true},
        {title:'Inception', director:'Christopher Nolan', year:'2010', genre:'Sci-Fi', rating:5, description:'Dreams within dreams.', watched:true},
        {title:'The Dark Knight', director:'Christopher Nolan', year:'2008', genre:'Action', rating:5, description:'Batman vs Joker.', watched:true},
    ];
    movies=samples.map((s,i)=>({...s,id:Date.now()+i}));
    saveToLocal();
}

updateDashboard();
