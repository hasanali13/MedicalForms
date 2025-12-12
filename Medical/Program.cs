using Microsoft.EntityFrameworkCore;
using Medical.Data;

var builder = WebApplication.CreateBuilder(args);

// DATABASE
builder.Services.AddDbContext<MedicalContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("MedicalContext"),
        sqlServerOptions => sqlServerOptions.EnableRetryOnFailure()
    )
);

// MVC + Views
builder.Services.AddControllersWithViews();

// SESSION (IMPORTANT)
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
});

var app = builder.Build();

// ERROR HANDLING
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

// MIDDLEWARE PIPELINE
app.UseHttpsRedirection();
app.UseStaticFiles();      // <--- REQUIRED
app.UseRouting();

app.UseSession();          // <--- ENABLE SESSION HERE

app.UseAuthorization();

// ROUTING
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=ViewPublicForms}/{action=Create}/{id?}"
);

// Create database if it doesn't exist
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<MedicalContext>();
        // This will create the database if it doesn't exist
        context.Database.EnsureCreated();
        Console.WriteLine("Database created successfully!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database creation failed: {ex.Message}");
    }
}

// RUN APP
app.Run();